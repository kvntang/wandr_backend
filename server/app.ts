import AuthenticatingConcept from "./concepts/authenticating";
import CommentingConcept from "./concepts/commenting";
import FriendingConcept from "./concepts/friending";
import PostingConcept from "./concepts/posting";
import SessioningConcept from "./concepts/sessioning";

// import SuggestingConcept from "./concepts/suggesting";
// import SummarizingConcept from "./concepts/summarizing";
// import CategorizingConcept from "./concepts/categorizing";

// The app is a composition of concepts instantiated here
// and synchronized together in `routes.ts`.
export const Sessioning = new SessioningConcept();
export const Authing = new AuthenticatingConcept("users");
export const Posting = new PostingConcept("posts");
export const Friending = new FriendingConcept("friends");
export const Commenting = new CommentingConcept("comments");

// export const Suggesting = new SuggestingConcept();
// export const Summarizing = new SummarizingConcept();
// export const Categorizing = new CategorizingConcept();
