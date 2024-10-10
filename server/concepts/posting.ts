import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface PostOptions {
  backgroundColor?: string;
}

export interface PostDoc extends BaseDoc {
  author: ObjectId;
  content: string;
  options?: PostOptions;
  photo?: string; // Added the new field for the photo (Base64 string)
}

/**
 * concept: Posting [Author]
 */
export default class PostingConcept {
  public readonly posts: DocCollection<PostDoc>;

  /**
   * Make an instance of Posting.
   */
  constructor(collectionName: string) {
    this.posts = new DocCollection<PostDoc>(collectionName);
  }

  // async create(author: ObjectId, content: string, options?: PostOptions) {
  //   const _id = await this.posts.createOne({ author, content, options });
  //   return { msg: "Post successfully created!", post: await this.posts.readOne({ _id }) };
  // }

  async create(author: ObjectId, content: string, options?: PostOptions, photo?: string) {
    // console.log("Document to be created:", { author, content, options, photo }); // Log the document

    // Add the photo (Base64) directly into the document if provided
    const _id = await this.posts.createOne({ author, content, options, photo });
    return { msg: "Post successfully created!", post: await this.posts.readOne({ _id }) };
  }

  async getPosts() {
    // Returns all posts! You might want to page for better client performance
    return await this.posts.readMany({}, { sort: { _id: -1 } });
  }

  async getByAuthor(author: ObjectId) {
    return await this.posts.readMany({ author });
  }

  async getByPost(_id: ObjectId) {
    // Fetch a single post and return it as an array with either one element or empty
    const post = await this.posts.readOne({ _id });
    return post ? [post] : []; // Wrap the post in an array or return an empty array
  }

  // async getByPost(_id: ObjectId): Promise<PostDoc | null> {
  //   // Fetch a single post by its ObjectId
  //   const post = await this.posts.readOne({ _id });
  //   return post; // Returns the PostDoc or null
  // }

  async update(_id: ObjectId, content?: string, options?: PostOptions) {
    // Note that if content or options is undefined, those fields will *not* be updated
    // since undefined values for partialUpdateOne are ignored.
    await this.posts.partialUpdateOne({ _id }, { content, options });
    return { msg: "Post successfully updated!" };
  }

  async delete(_id: ObjectId) {
    await this.posts.deleteOne({ _id });
    return { msg: "Post deleted successfully!" };
  }

  async assertAuthorIsUser(_id: ObjectId, user: ObjectId) {
    const post = await this.posts.readOne({ _id });
    if (!post) {
      throw new NotFoundError(`Post ${_id} does not exist!`);
    }
    if (post.author.toString() !== user.toString()) {
      throw new PostAuthorNotMatchError(user, _id);
    }
  }

  async assertPostExist(_id: ObjectId) {
    const post = await this.posts.readOne({ _id });
    if (!post) {
      throw new NotFoundError(`Post with ID ${_id} does not exist!`);
    }
    return post; // Return the post if it exists
  }
}

export class PostAuthorNotMatchError extends NotAllowedError {
  constructor(
    public readonly author: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the author of post {1}!", author, _id);
  }
}
