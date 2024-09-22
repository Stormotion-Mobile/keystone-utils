import { BaseListTypeInfo, ListAccessControl } from "@keystone-6/core/types";
import { integer, relationship, text } from "@keystone-6/core/fields";
import {
  ListAdminUIConfig,
  ListConfig,
} from "@keystone-6/core/dist/declarations/src/types/config/lists";

export const localeList = <ListTypeInfo extends BaseListTypeInfo>({
  access,
  ui,
}: {
  access: ListAccessControl<ListTypeInfo>;
  ui?: ListAdminUIConfig<ListTypeInfo>;
}): ListConfig<ListTypeInfo> => ({
  access,
  fields: {
    name: text({ isIndexed: "unique", validation: { isRequired: true } }),
    code: text({ isIndexed: "unique", validation: { isRequired: true } }),
    priority: integer({
      db: {
        isNullable: false,
      },
    }),
  },
  ui,
});

export const translationList = <ListTypeInfo extends BaseListTypeInfo>({
  access,
  ui,
}: {
  access: ListAccessControl<ListTypeInfo>;
  ui?: ListAdminUIConfig<ListTypeInfo>;
}): ListConfig<ListTypeInfo> => ({
  access,
  fields: {
    locale: relationship({
      many: false,
      ref: "Locale",
    }),
    text: text({ validation: { isRequired: true } }),
    translationId: text({ validation: { isRequired: true } }),
  },
  ui,
});
