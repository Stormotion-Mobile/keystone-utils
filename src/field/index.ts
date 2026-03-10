import { BaseListTypeInfo, FieldTypeFunc } from "@keystone-6/core/types";
import { translationField } from "./translationField";
import { TextFieldConfig } from "../utils/types";

export function translation<ListTypeInfo extends BaseListTypeInfo>(
  config: TextFieldConfig<ListTypeInfo> = {}
): FieldTypeFunc<ListTypeInfo> {
  return translationField({
    ...config,
    views: "keystone-localization/src/field/views",
  });
}
