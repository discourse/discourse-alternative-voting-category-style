import EmberObject from "@ember/object";
import { service } from "@ember/service";
import discourseComputed from "discourse/lib/decorators";
import { i18n } from "discourse-i18n";

const votingCategories = settings.voting_categories.split("|");

export default EmberObject.extend({
  router: service(),
  @discourseComputed("router.currentRoute", "site.desktopView")
  showVoteCount(currentRoute, isDesktop) {
    if (
      isDesktop &&
      this.topic.can_vote &&
      currentRoute.params?.category_slug_path_with_id
    ) {
      const splitCatPath =
        currentRoute.params.category_slug_path_with_id.split("/");
      const isVotingCategory = votingCategories.some(
        (category) => category === splitCatPath[splitCatPath.length - 1]
      );
      if (isVotingCategory) {
        document.body.classList.add("voting-category");
        return true;
      }
      document.body.classList.remove("voting-category");
      return false;
    }
  },
  @discourseComputed()
  userVotedClass() {
    return this.topic.user_voted ? "" : "can-vote";
  },
  @discourseComputed()
  votingDisabled() {
    if (
      (this.currentUser?.votes_left <= 0 && !this.topic.user_voted) ||
      this.topic.closed ||
      this.topic.unread === undefined
    ) {
      return "disabled";
    }
  },
  @discourseComputed()
  voteCount() {
    return this.topic.vote_count;
  },
  @discourseComputed()
  votedStatus() {
    if (settings.vote_from_topic_list) {
      if (this.topic.unread === undefined) {
        return i18n(themePrefix("must_view_first"));
      }
      if (this.topic.closed) {
        return i18n(themePrefix("closed"));
      }
      if (this.currentUser?.votes_left <= 0 && !this.topic.user_voted) {
        return i18n(themePrefix("out_of_votes"));
      }
      return this.topic.user_voted
        ? i18n(themePrefix("user_vote"))
        : i18n(themePrefix("user_no_vote"));
    }
    return;
  },
});
