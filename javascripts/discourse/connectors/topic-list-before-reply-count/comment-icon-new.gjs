import Component from "@glimmer/component";
import { service } from "@ember/service";
import icon from "discourse/helpers/d-icon";

const votingCategories = settings.voting_categories.split("|");

export default class CommentIcon extends Component {
  @service router;
  @service site;

  get showCommentIcon() {
    const path = this.router.currentRoute.params?.category_slug_path_with_id;

    if (this.site.desktopView && path) {
      const id = path.split("/").at(-1);
      return votingCategories.some((category) => category === id);
    }
  }

  <template>
    {{#if this.showCommentIcon}}
      {{icon "far-comment"}}
    {{/if}}
  </template>
}
