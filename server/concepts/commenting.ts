import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface CommentDoc extends BaseDoc {
  author: ObjectId;
  postId: ObjectId; // The post this comment is associated with
  content: string;
}

/**
 * concept: Commenting [Author]
 */
export default class CommentingConcept {
  public readonly comments: DocCollection<CommentDoc>;

  /**
   * Make an instance of Commenting.
   */
  constructor(collectionName: string) {
    this.comments = new DocCollection<CommentDoc>(collectionName);
  }

  async create(author: ObjectId, postId: ObjectId, content: string) {
    const _id = await this.comments.createOne({ author, postId, content });
    return { msg: "Comment successfully created!", comment: await this.comments.readOne({ _id }) };
  }

  async getComments() {
    // Returns all comments! You might want to page for better client performance
    return await this.comments.readMany({}, { sort: { _id: -1 } });
  }

  async getByPost(postId: ObjectId) {
    return await this.comments.readMany({ postId }, { sort: { _id: -1 } });
  }

  async getByUser(author: ObjectId) {
    return await this.comments.readMany({ author }, { sort: { _id: -1 } });
  }

  async update(_id: ObjectId, content?: string) {
    // Update only the content of the comment
    await this.comments.partialUpdateOne({ _id }, { content });
    return { msg: "Comment successfully updated!" };
  }

  async delete(_id: ObjectId) {
    await this.comments.deleteOne({ _id });
    return { msg: "Comment deleted successfully!" };
  }

  async assertAuthorIsUser(_id: ObjectId, user: ObjectId) {
    const comment = await this.comments.readOne({ _id });
    if (!comment) {
      throw new NotFoundError(`Comment ${_id} does not exist!`);
    }
    if (comment.author.toString() !== user.toString()) {
      throw new CommentAuthorNotMatchError(user, _id);
    }
  }
}

export class CommentAuthorNotMatchError extends NotAllowedError {
  constructor(
    public readonly author: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the author of comment {1}!", author, _id);
  }
}
