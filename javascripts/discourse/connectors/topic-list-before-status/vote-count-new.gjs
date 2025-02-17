import Component from "@glimmer/component";
import { on } from "@ember/modifier";
import { action } from "@ember/object";
import { service } from "@ember/service";
import bodyClass from "discourse/helpers/body-class";
import concatClass from "discourse/helpers/concat-class";
import icon from "discourse/helpers/d-icon";
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";
import { i18n } from "discourse-i18n";

export default class VoteCount extends Component {
  @service currentUser;
  @service discovery;
  @service site;

  get topic() {
    return this.args.outletArgs.topic;
  }

  get showVoteCount() {
    const votingCategories = settings.voting_categories.split("|").map(Number);
    const id = this.discovery.category?.id;

    return (
      this.site.desktopView &&
      this.topic.get("can_vote") &&
      id &&
      votingCategories.some((category) => category === id)
    );
  }

  get votingDisabled() {
    return (
      (this.currentUser?.get("votes_left") <= 0 &&
        !this.topic.get("user_voted")) ||
      this.topic.get("closed") ||
      this.topic.get("unread") === undefined
    );
  }

  get votedStatus() {
    if (!settings.vote_from_topic_list) {
      return;
    }

    if (this.topic.get("unread") === undefined) {
      return i18n(themePrefix("must_view_first"));
    } else if (this.topic.get("closed")) {
      return i18n(themePrefix("closed"));
    } else if (
      this.currentUser?.get("votes_left") <= 0 &&
      !this.topic.get("user_voted")
    ) {
      return i18n(themePrefix("out_of_votes"));
    } else {
      return this.topic.get("user_voted")
        ? i18n(themePrefix("user_vote"))
        : i18n(themePrefix("user_no_vote"));
    }
  }

  @action
  async vote() {
    if (
      !settings.vote_from_topic_list ||
      (this.currentUser.get("votes_left") <= 0 && !this.topic.user_voted) ||
      this.topic.closed ||
      this.topic.unread === undefined
    ) {
      return;
    }

    let voteType;

    if (this.topic.user_voted) {
      this.topic.set("vote_count", this.topic.vote_count - 1);
      voteType = "unvote";

      this.currentUser.set("votes_left", this.currentUser.votes_left + 1);
      this.topic.set("user_voted", false);
    } else {
      this.topic.set("vote_count", this.topic.vote_count + 1);
      voteType = "vote";

      this.currentUser.set("votes_left", this.currentUser.votes_left - 1);
      this.topic.set("user_voted", true);
    }

    try {
      const result = await ajax(`/voting/${voteType}`, {
        type: "POST",
        data: { topic_id: this.topic.id },
      });

      this.currentUser.setProperties({
        votes_exceeded: !result.can_vote,
        votes_left: result.votes_left,
      });
    } catch (e) {
      popupAjaxError(e);
    }
  }

  <template>
    {{#if this.showVoteCount}}
      {{bodyClass "voting-category"}}

      <div class="vote-count-before-title">
        <button
          {{on "click" this.vote}}
          type="button"
          title={{this.votedStatus}}
          class={{concatClass
            "topic-list-vote-button btn-flat"
            (unless this.topic.user_voted "can-vote")
            (if this.votingDisabled "disabled")
          }}
        >{{icon "caret-up"}}</button>
        <span class="vote-count-value">{{this.topic.vote_count}}</span>
      </div>
    {{/if}}
  </template>
}
