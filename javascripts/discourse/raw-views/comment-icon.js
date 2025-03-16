import EmberObject from "@ember/object";
import { service } from "@ember/service";
import discourseComputed from "discourse/lib/decorators";

const votingCategories = settings.voting_categories.split("|");

export default class CommentIcon extends EmberObject {
  @service router;

  @discourseComputed("router.currentRoute", "site.desktopView")
  showCommentIcon(currentRoute, isDesktop) {
    if (isDesktop && currentRoute.params?.category_slug_path_with_id) {
      const splitCatPath =
        currentRoute.params.category_slug_path_with_id.split("/");
      return votingCategories.some(
        (category) => category === splitCatPath[splitCatPath.length - 1]
      );
    }
  }
}
