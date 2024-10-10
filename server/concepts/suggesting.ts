import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";

// Define the schema for the AutoCaption documents
export interface AutoCaptionDoc extends BaseDoc {
  postId: ObjectId; // target post
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
    const _id = await this.captions.createOne({ postId });
    return { msg: "Auto-caption successfully created!", caption: await this.captions.readOne({ _id }) };
  }
}
