import { BaseListTypeInfo, CommonFieldConfig, JSONValue, FieldTypeFunc, ListAccessControl } from '@keystone-6/core/types';
import { ListAdminUIConfig, ListConfig } from '@keystone-6/core/dist/declarations/src/types/config/lists';
import * as graphql from 'graphql';

type DisplayMode = "input" | "textarea";
type TextFieldConfig<ListTypeInfo extends BaseListTypeInfo> = CommonFieldConfig<ListTypeInfo> & {
    isIndexed?: boolean | "unique";
    ui?: {
        displayMode?: DisplayMode;
        isExpandable?: boolean;
        enableTranslator?: boolean;
    };
    defaultJSON?: JSONValue;
    enableTranslator?: boolean;
};

declare function translation<ListTypeInfo extends BaseListTypeInfo>(config?: TextFieldConfig<ListTypeInfo>): FieldTypeFunc<ListTypeInfo>;

declare const labelFromTranslationField: <ListTypeInfo extends BaseListTypeInfo>(translationFieldName: ListTypeInfo["fields"]) => FieldTypeFunc<ListTypeInfo>;

declare const localeList: <ListTypeInfo extends BaseListTypeInfo>({ access, ui, }: {
    access: ListAccessControl<ListTypeInfo>;
    ui?: ListAdminUIConfig<ListTypeInfo>;
}) => ListConfig<ListTypeInfo>;
declare const translationList: <ListTypeInfo extends BaseListTypeInfo>({ access, ui, }: {
    access: ListAccessControl<ListTypeInfo>;
    ui?: ListAdminUIConfig<ListTypeInfo>;
}) => ListConfig<ListTypeInfo>;

declare const translationSchemaExtension: ({ deeplKey, deeplContext, }: {
    deeplKey: string;
    deeplContext: string;
}) => (schema: graphql.GraphQLSchema) => graphql.GraphQLSchema;

export { labelFromTranslationField, localeList, translation, translationList, translationSchemaExtension };
