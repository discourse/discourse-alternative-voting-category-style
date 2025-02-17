import Component from "@glimmer/component";
import { service } from "@ember/service";
import icon from "discourse/helpers/d-icon";

const votingCategories = settings.voting_categories.split("|");

export default class CommentIcon extends Component {
  @service discovery;
  @service site;

  get showCommentIcon() {
    const id = this.discovery.category?.id;

    if (this.site.desktopView && id) {
      return votingCategories.some((category) => category === id);
    }
  }

  <template>
    {{#if this.showCommentIcon}}
      {{icon "far-comment"}}
    {{/if}}
  </template>
}
