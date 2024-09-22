import React, {
  CSSProperties,
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FieldContainer,
  FieldDescription,
  FieldLabel,
  TextArea,
  TextInput,
} from "@keystone-ui/fields";
import { CellContainer, CellLink } from "@keystone-6/core/admin-ui/components";
import {
  CardValueComponent,
  CellComponent,
  FieldController,
  FieldControllerConfig,
  FieldProps,
} from "@keystone-6/core/types";
import { useLazyQuery, useQuery } from "@keystone-6/core/admin-ui/apollo";
import { v4 } from "uuid";
import { Button } from "@keystone-ui/button";
import { difference } from "ramda";
import { Locale, TranslationFieldMeta } from "../utils/types";
import { QUERY_LOCALES, QUERY_TRANSLATED_VALES } from "../utils/queries";

export function Field({
  field,
  value,
  onChange,
  autoFocus,
}: FieldProps<typeof controller>) {
  const disabled = onChange === undefined;

  const [isExpanded, setIsExpanded] = useState(false);

  const toggleButton = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  useEffect(() => {
    if (!value.translationId) {
      onChange?.({
        ...value,
        translationId: `${value.listKey}.${field.path}.${v4()}`,
        translations: field.fieldMeta.defaultJSON
          ? { en: JSON.stringify(field.fieldMeta.defaultJSON, null, 2) }
          : {},
      });
    }
  }, [field.path, onChange, value]);

  const { data } = useQuery(QUERY_LOCALES);

  const [getTranslatedValues, { loading }] = useLazyQuery(
    QUERY_TRANSLATED_VALES
  );

  useEffect(() => {
    onChange?.({ ...value, locales: data?.locales });
  }, [data?.locales]);

  const locales = [...(data?.locales || [])].sort(
    (a, b) => a.priority - b.priority
  );

  const inputs = useMemo(
    () =>
      locales.map((locale: { id: string; name: string; code: string }) => {
        const onInputChange = (
          event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        ) => {
          const newTranslations = value.translations ?? {};
          newTranslations[locale.code] = event.target.value;
          onChange?.({
            ...value,
            translations: newTranslations,
          });
        };
        const inputValue = value.translations?.[locale.code] || "";
        const TextContainer =
          field.fieldMeta.displayMode === "textarea" ? TextArea : TextInput;
        return (
          <div key={locale.id}>
            <div>{locale.name}</div>
            <TextContainer
              type="text"
              onChange={onInputChange}
              disabled={disabled}
              value={inputValue}
              autoFocus={autoFocus}
            />
          </div>
        );
      }),
    [locales, disabled, value, autoFocus, onChange]
  );

  const [priorityLocale, ...otherLocales] = inputs;

  const onSyncLocales = useCallback(async () => {
    if (loading) {
      return;
    }
    const localesList = locales.map((locale) => locale.code);
    const localesToTranslate = difference(localesList, ["en"]);
    const stringInEnglish = value.translations?.en;
    const translatedValues = await getTranslatedValues({
      variables: { locales: localesToTranslate, value: stringInEnglish },
    });
    onChange?.({
      ...value,
      translations: { ...translatedValues.data?.translatedValues },
    });
  }, [value, locales]);

  return value.translationId ? (
    <FieldContainer as="fieldset">
      <FieldLabel>{field.label}</FieldLabel>
      <FieldDescription id={`${field.path}-description`}>
        {field.description}
      </FieldDescription>
      <div>{priorityLocale}</div>
      {(isExpanded || !field.fieldMeta.isExpandable) && (
        <div>{otherLocales}</div>
      )}
      <div>
        {field.fieldMeta.isExpandable && (
          <Button style={styles.collapseButton} onClick={toggleButton}>
            {isExpanded ? "Collapse" : "Expand"}
          </Button>
        )}
        {field.fieldMeta.enableTranslation && (
          <Button style={styles.syncButton} onClick={onSyncLocales}>
            Translate
          </Button>
        )}
      </div>
    </FieldContainer>
  ) : null;
}

export const Cell: CellComponent = ({ item, linkTo, field }) => {
  const value = item[field.graphqlSelection];
  return linkTo ? (
    <CellLink {...linkTo}>{value}</CellLink>
  ) : (
    <CellContainer>{value}</CellContainer>
  );
};
Cell.supportsLinkTo = true;

export const CardValue: CardValueComponent = ({ item, field }) => {
  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      {item[field.path]}
    </FieldContainer>
  );
};

export const controller = (
  config: FieldControllerConfig<TranslationFieldMeta>
): FieldController<
  {
    locales?: Locale[];
    translationId?: string;
    translations?: Record<string, string>;
    listKey: string;
  },
  string
> & {
  fieldMeta: TranslationFieldMeta;
} => {
  return {
    defaultValue: {
      listKey: config.listKey,
      translations: {},
    },
    description: config.description,
    deserialize: (data) => {
      const value = data[config.path];
      return JSON.parse(value);
    },
    fieldMeta: config.fieldMeta,
    graphqlSelection: config.path,
    label: config.label,
    path: config.path,
    serialize: (value) => {
      return {
        [config.path]: JSON.stringify(value),
      };
    },
  };
};

const styles: Record<string, CSSProperties> = {
  collapseButton: {
    marginTop: 10,
  },
  syncButton: {
    marginLeft: 10,
  },
};
