import { apiInitializer } from "discourse/lib/api";

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
});
