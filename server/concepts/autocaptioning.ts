import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotFoundError } from "./errors";

// Define the schema for the AutoCaption documents
export interface AutoCaptionDoc extends BaseDoc {
  postId: ObjectId; // The post associated with this auto-generated caption
  caption: string; // The auto-generated caption content
}

/**
 * Concept: AutoCaptioning [Author]
 */
export default class AutoCaptioningConcept {
  public readonly captions: DocCollection<AutoCaptionDoc>;

  /**
   * Make an instance of AutoCaptioning.
   */
  constructor(collectionName: string) {
    this.captions = new DocCollection<AutoCaptionDoc>(collectionName);
  }

  async create(postId: ObjectId, caption: string) {
    const _id = await this.captions.createOne({ postId, caption });
    return { msg: "Auto-caption successfully created!", caption: await this.captions.readOne({ _id }) };
  }

  async getAllCaptions() {
    // Returns all captions; pagination can be added for better performance
    return await this.captions.readMany({}, { sort: { _id: -1 } });
  }

  async getByPost(postId: ObjectId) {
    return await this.captions.readMany({ postId }, { sort: { _id: -1 } });
  }

  async delete(_id: ObjectId) {
    await this.captions.deleteOne({ _id });
    return { msg: "Auto-caption deleted successfully!" };
  }

  async assertCaptionExists(postId: ObjectId) {
    const caption = await this.captions.readOne({ postId });
    if (caption) {
      throw new NotFoundError(`${postId} already has a caption associated with it!`);
    }
  }

  async update(_id: ObjectId, caption?: string) {
    // Update only the content of the comment
    await this.captions.partialUpdateOne({ _id }, { caption });
    return { msg: "Auto-caption successfully updated!" };
  }
}
