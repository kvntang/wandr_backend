import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Authing, AutoCaptioning, Commenting, Friending, Posting, Sessioning } from "./app";
import { PostOptions } from "./concepts/posting";
import { SessionDoc } from "./concepts/sessioning";
import Responses from "./responses";

import { z } from "zod";

//huggingface API stuff
import { HfInference } from "@huggingface/inference";
import * as dotenv from "dotenv";
// Initialize dotenv to load environment variables
dotenv.config();
// Create an instance of HfInference with your API token
const inference = new HfInference(process.env.HUGGING_FACE_API_TOKEN);

/**
 * Web server routes for the app. Implements synchronizations between concepts.
 */
class Routes {
  // Synchronize the concepts from `app.ts`.

  //////////////////// Session ////////////////////////////////////////
  @Router.get("/session")
  async getSessionUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.getUserById(user);
  }

  @Router.post("/login")
  async logIn(session: SessionDoc, username: string, password: string) {
    const u = await Authing.authenticate(username, password);
    Sessioning.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: SessionDoc) {
    Sessioning.end(session);
    return { msg: "Logged out!" };
  }

  //////////////////// Authenticate ////////////////////////////////////////
  @Router.get("/users")
  async getUsers() {
    return await Authing.getUsers();
  }

  @Router.get("/users/:username")
  @Router.validate(z.object({ username: z.string().min(1) }))
  async getUser(username: string) {
    return await Authing.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: SessionDoc, username: string, password: string) {
    Sessioning.isLoggedOut(session);
    return await Authing.create(username, password);
  }

  @Router.patch("/users/username")
  async updateUsername(session: SessionDoc, username: string) {
    const user = Sessioning.getUser(session);
    return await Authing.updateUsername(user, username);
  }

  @Router.patch("/users/password")
  async updatePassword(session: SessionDoc, currentPassword: string, newPassword: string) {
    const user = Sessioning.getUser(session);
    return Authing.updatePassword(user, currentPassword, newPassword);
  }

  @Router.delete("/users")
  async deleteUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    Sessioning.end(session);
    return await Authing.delete(user);
  }

  @Router.patch("/users/step")
  async updateStep(session: SessionDoc, stepSize: string) {
    const userId = Sessioning.getUser(session);
    const result = await Authing.updateStepSize(userId, stepSize);
    return result;
  }

  //////////////////// Post ////////////////////////////////////////
  @Router.get("/posts")
  @Router.validate(z.object({ username: z.string().optional() }))
  async getPosts(username?: string) {
    let posts;
    if (username) {
      const id = (await Authing.getUserByUsername(username))._id;
      posts = await Posting.getByAuthor(id);
    } else {
      posts = await Posting.getPosts();
    }
    return Responses.posts(posts);
  }

  @Router.get("/posts/single/:id")
  async getPost(id: string) {
    const postOid = new ObjectId(id); //convert from String
    await Posting.assertPostExist(postOid);
    const post = await Posting.getByPost(postOid);
    return Responses.posts(post);
  }

  // @Router.post("/posts")
  // async createPost(session: SessionDoc, content: string, options?: PostOptions) {
  //   const user = Sessioning.getUser(session);
  //   const created = await Posting.create(user, content, options);
  //   return { msg: created.msg, post: await Responses.post(created.post) };
  // }

  @Router.post("/posts")
  async createPost(session: SessionDoc, content: string, options?: PostOptions, photo?: string) {
    const user = Sessioning.getUser(session);

    // console.log("Received Photo (Base64):", photo); // Log the photo to verify

    // Pass the photo (Base64 string) along with content and options to the create method
    const created = await Posting.create(user, content, options, photo);

    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:id")
  async updatePost(session: SessionDoc, id: string, content?: string, options?: PostOptions) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);
    return await Posting.update(oid, content, options);
  }

  @Router.delete("/posts/:id")
  async deletePost(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);
    return Posting.delete(oid);
  }

  //////////////////// Friend ////////////////////////////////////////
  @Router.get("/friends")
  async getFriends(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.idsToUsernames(await Friending.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: SessionDoc, friend: string) {
    const user = Sessioning.getUser(session);
    const friendOid = (await Authing.getUserByUsername(friend))._id;
    return await Friending.removeFriend(user, friendOid);
  }

  @Router.get("/friend/requests")
  async getRequests(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Responses.friendRequests(await Friending.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.sendRequest(user, toOid);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.removeRequest(user, toOid);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.acceptRequest(fromOid, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.rejectRequest(fromOid, user);
  }

  //////////////////// Comment ////////////////////////////////////////
  @Router.get("/comments")
  @Router.validate(z.object({ postId: z.string().optional() }))
  async getComments(postId?: string) {
    let comments;
    if (postId) {
      const postOid = new ObjectId(postId);
      comments = await Commenting.getByPost(postOid);
    } else {
      comments = await Commenting.getComments();
    }

    return Responses.comments(comments);
  }

  @Router.post("/comments")
  async createComment(session: SessionDoc, postId: string, content: string) {
    const user = Sessioning.getUser(session);
    const postOid = new ObjectId(postId);
    const created = await Commenting.create(user, postOid, content);
    return { msg: created.msg, comment: await Responses.comment(created.comment) };
  }

  @Router.patch("/comments/:id")
  async updateComment(session: SessionDoc, id: string, content: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Commenting.assertAuthorIsUser(oid, user);
    return await Commenting.update(oid, content);
  }

  @Router.delete("/comments/:id")
  async deleteComment(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Commenting.assertAuthorIsUser(oid, user);
    return await Commenting.delete(oid);
  }

  //////////////////// Auto Caption ////////////////////////////////////////
  @Router.post("/autocaptions")
  async createAutoCaption(postId: string) {
    const postOid = new ObjectId(postId);
    await Posting.assertPostExist(postOid); // Ensure the post exists

    //need to check if a caption already has postid
    await AutoCaptioning.assertCaptionExists(postOid);

    //get the photo
    const post = await Posting.getByPost(postOid);

    let imageData = post[0].photo as string;
    imageData = imageData.replace(/^data:image\/[a-z]+;base64,/, ""); // Remove data URL prefix if present
    const imageBuffer = Buffer.from(imageData, "base64");

    // Generate caption using the Hugging Face Inference API
    console.log("generating caption...");
    const caption = await generateCaptionFromImageBuffer(imageBuffer);

    // Store the caption in MongoDB
    const created = await AutoCaptioning.create(postOid, caption);

    return { msg: created.msg, caption: caption };
  }

  @Router.get("/autocaptions")
  @Router.validate(z.object({ postId: z.string().optional() }))
  async getAutoCaptions(postId?: string) {
    let autoCaptions;
    if (postId) {
      // get the one
      const postOid = new ObjectId(postId);
      autoCaptions = await AutoCaptioning.getByPost(postOid);
    } else {
      //get all
      autoCaptions = await AutoCaptioning.getAllCaptions();
    }
    return autoCaptions;
  }

  @Router.patch("/autocaptions/update/:postid")
  async updateAutoCaption(postid: string) {
    const postOid = new ObjectId(postid);
    await Posting.assertPostExist(postOid); // Ensure the post exists

    //get the photo
    const post = await Posting.getByPost(postOid);
    let imageData = post[0].photo as string;
    imageData = imageData.replace(/^data:image\/[a-z]+;base64,/, ""); // Remove data URL prefix if present
    const imageBuffer = Buffer.from(imageData, "base64");

    // Generate caption using the Hugging Face Inference API
    console.log("regenerating caption...");
    const caption = await generateCaptionFromImageBuffer(imageBuffer);

    // Store the caption in MongoDB
    const created = await AutoCaptioning.update(postOid, caption);

    return { msg: created.msg, caption: caption };
  }
}

async function generateCaptionFromImageBuffer(imageBuffer: Buffer): Promise<string> {
  try {
    // Use the inference API to generate the caption
    const result = await inference.imageToText({
      data: imageBuffer,
      model: "nlpconnect/vit-gpt2-image-captioning",
    });

    return result.generated_text;
  } catch (error) {
    console.error("Error generating caption from image buffer:", error);
    throw error;
  }

  ////////////////////////////////////////////////////////////////////////
}

/** The web app. */
export const app = new Routes();

/** The Express router. */
export const appRouter = getExpressRouter(app);
