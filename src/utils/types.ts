import {
  BaseListTypeInfo,
  CommonFieldConfig,
  JSONValue,
} from "@keystone-6/core/types";

export type Locale = {
  id: string;
  name: string;
  code: string;
  priority: number;
};

export type DisplayMode = "input" | "textarea";

export type TranslationFieldMeta = {
  displayMode: DisplayMode;
  defaultJSON?: JSONValue;
  isExpandable?: boolean;
  enableTranslator?: boolean;
};

export type TextFieldConfig<ListTypeInfo extends BaseListTypeInfo> =
  CommonFieldConfig<ListTypeInfo> & {
    isIndexed?: boolean | "unique";
    ui?: {
      displayMode?: DisplayMode;
      isExpandable?: boolean;
      enableTranslator?: boolean;
    };
    defaultJSON?: JSONValue;
    enableTranslator?: boolean;
  };
