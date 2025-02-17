import { alias } from "@ember/object/computed";
import { service } from "@ember/service";
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";
import { apiInitializer } from "discourse/lib/api";
import discourseComputed from "discourse/lib/decorators";
import { withSilencedDeprecations } from "discourse/lib/deprecated";
import { i18n } from "discourse-i18n";

const votingCategories = settings.voting_categories.split("|").map(Number);

export default apiInitializer("1.1", (api) => {
  const discovery = api.container.lookup("service:discovery");

  function isVotingCategory() {
    const currentCategoryId = discovery.category?.id;
    return (
      currentCategoryId && votingCategories.some((c) => c === currentCategoryId)
    );
  }

  api.registerValueTransformer("topic-list-columns", ({ value: columns }) => {
    if (isVotingCategory()) {
      columns.delete("activity");
      columns.delete("views");
      columns.delete("posters");
    }
  });

  api.registerValueTransformer(
    "topic-list-item-class",
    ({ value, context }) => {
      if (!context.topic.get("can_vote")) {
        value.push("non-voting");
      }
      return value;
    }
  );

  api.registerValueTransformer("topic-list-item-expand-pinned", ({ value }) => {
    return (
      ((settings.include_excerpts || settings.vote_from_topic_list) &&
        isVotingCategory()) ||
      value
    );
  });

  withSilencedDeprecations("discourse.hbr-topic-list-overrides", () => {
    api.modifyClass("component:topic-list-item", {
      pluginId: "discourse-alternative-voting-category-style",
      excerptsRouter: service("router"),
      votesLeft: alias("currentUser.votes_left"),
      userVoted: alias("topic.user_voted"),

      @discourseComputed("topic")
      unboundClassNames(topic) {
        let classList = this._super(...arguments);
        if (!topic.can_vote) {
          classList += " non-voting";
        }
        return classList;
      },

      @discourseComputed("excerptsRouter.currentRoute.attributes.category.id")
      expandPinned(currentCategoryId) {
        return currentCategoryId &&
          (settings.include_excerpts || settings.vote_from_topic_list) &&
          votingCategories.some((c) => c === Number(currentCategoryId))
          ? true
          : this._super();
      },
      click(e) {
        const target = e.target;
        const topic = this.topic;
        if (
          target.classList.contains("topic-list-vote-button") &&
          settings.vote_from_topic_list &&
          (this.votesLeft > 0 || this.userVoted) &&
          !topic.closed &&
          topic.unread !== undefined
        ) {
          let voteCountElem = target.nextElementSibling;
          let voteCount = parseInt(voteCountElem.innerHTML, 10);
          let voteType;

          if (target.classList.contains("can-vote")) {
            voteCountElem.innerHTML = voteCount + 1;
            voteType = "vote";

            this.set("votesLeft", this.votesLeft - 1);
            this.set("userVoted", true);

            if (this.votesLeft === 0) {
              document
                .querySelectorAll(
                  ".topic-list-item:not(.closed) .topic-list-vote-button.can-vote"
                )
                .forEach((voteButton) => {
                  const tli = voteButton.closest(".topic-list-item");
                  if (
                    tli.classList.contains("visited") ||
                    !tli.classList.contains("unseen-topic")
                  ) {
                    voteButton.classList.add("disabled");
                    voteButton.title = i18n(themePrefix("out_of_votes"));
                  }
                });
            }
            // Ensure clicked button has proper title and class
            target.title = i18n(themePrefix("user_vote"));
            target.classList.remove("disabled");
          } else {
            voteCountElem.innerHTML = voteCount - 1;
            voteType = "unvote";

            this.set("votesLeft", this.votesLeft + 1);
            this.set("userVoted", false);

            if (this.votesLeft > 0) {
              document
                .querySelectorAll(
                  ".topic-list-item:not(.closed) .topic-list-vote-button.can-vote"
                )
                .forEach((voteButton) => {
                  const tli = voteButton.closest(".topic-list-item");
                  if (
                    tli.classList.contains("visited") ||
                    !tli.classList.contains("unseen-topic")
                  ) {
                    voteButton.classList.remove("disabled");
                    voteButton.title = i18n(themePrefix("user_no_vote"));
                  }
                });
            }

            target.title = i18n(themePrefix("user_no_vote"));
          }

          target.classList.toggle("can-vote");

          ajax(`/voting/${voteType}`, {
            type: "POST",
            data: {
              topic_id: topic.id,
            },
          })
            .then((result) => {
              this.currentUser.setProperties({
                votes_exceeded: !result.can_vote,
                votes_left: result.votes_left,
              });
            })
            .catch(popupAjaxError);
        }
        return this._super(...arguments);
      },
    });
  });
});
