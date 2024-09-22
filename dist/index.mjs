// src/field/translationField.ts
import { graphql } from "@keystone-6/core";
import {
  fieldType,
  orderDirectionEnum
} from "@keystone-6/core/types";
function translationField({
  isIndexed,
  ui,
  hooks,
  views,
  ...config
}) {
  return () => fieldType({
    index: isIndexed === true ? "index" : isIndexed || void 0,
    kind: "scalar",
    mode: "optional",
    scalar: "String"
  })({
    ...config,
    getAdminMeta() {
      return {
        defaultJSON: config.defaultJSON,
        displayMode: ui?.displayMode ?? "input",
        isExpandable: ui?.isExpandable,
        enableTranslator: config.enableTranslator
      };
    },
    hooks: {
      ...hooks,
      afterOperation: async ({
        operation,
        context,
        originalItem,
        fieldKey
      }) => {
        if (operation === "delete") {
          const prisma = context.prisma;
          await prisma.translation.deleteMany({
            where: {
              translationId: {
                equals: originalItem[fieldKey]
              }
            }
          });
        }
      }
    },
    input: {
      create: {
        arg: graphql.arg({ type: graphql.String }),
        async resolve(rawValue, context) {
          if (!rawValue) {
            return;
          }
          const value = JSON.parse(rawValue);
          const translationId = value.translationId;
          const locales = value.locales;
          const translations = value?.translations;
          const prisma = context.prisma;
          try {
            await prisma.translation.createMany({
              data: locales.filter(
                (locale) => Object.keys(translations).includes(locale.code)
              ).map((locale) => ({
                localeId: locale.id,
                text: translations[locale.code],
                translationId
              }))
            });
          } catch {
          }
          return translationId;
        }
      },
      orderBy: { arg: graphql.arg({ type: orderDirectionEnum }) },
      update: {
        arg: graphql.arg({ type: graphql.String }),
        async resolve(rawValue, context) {
          if (!rawValue) {
            return;
          }
          const value = JSON.parse(rawValue);
          const translationId = value?.translationId;
          const locales = value?.locales;
          const translations = value?.translations;
          const prisma = context.prisma;
          await prisma.$transaction(async (tx) => {
            const unusedLocales = [];
            await Promise.all(
              locales.map(async (locale) => {
                const text2 = translations[locale.code];
                if (!text2) {
                  await tx.translation.deleteMany({
                    where: {
                      localeId: {
                        equals: locale.id
                      },
                      translationId
                    }
                  });
                  return;
                }
                const result = await tx.translation.updateMany({
                  data: {
                    text: text2
                  },
                  where: {
                    localeId: {
                      equals: locale.id
                    },
                    translationId
                  }
                });
                if (result.count === 0) {
                  unusedLocales.push(locale);
                }
              })
            );
            await tx.translation.createMany({
              data: unusedLocales.map((locale) => ({
                localeId: locale.id,
                text: translations[locale.code],
                translationId
              }))
            });
          });
          return translationId;
        }
      }
    },
    output: graphql.field({
      async resolve({ value }, _, context, info) {
        const prisma = context.prisma;
        const locales = await prisma.locale.findMany({
          orderBy: {
            priority: "asc"
          }
        });
        const translations = value ? await prisma.translation.findMany({
          where: {
            translationId: {
              equals: value
            }
          }
        }) : [];
        const result = {};
        translations.forEach(
          ({ localeId, text: text2 }) => {
            const locale = locales.find((l) => l.id === localeId);
            if (!locale) {
              return;
            }
            result[locale.code] = text2;
          }
        );
        if (info.path.typename !== info.variableValues.listKey && info.path.prev?.typename !== "Mutation") {
          for (const locale of locales) {
            const translation2 = translations.find(
              (tr) => tr.localeId === locale.id
            );
            if (translation2) {
              return translation2.text;
            }
          }
          return "";
        }
        return JSON.stringify({
          listKey: info.path.typename,
          locales,
          translationId: value,
          translations: result
        });
      },
      type: graphql.String
    }),
    views
  });
}

// src/field/index.ts
function translation(config = {}) {
  return translationField({ ...config, views: "./translation-field/views" });
}

// src/field/labelFromTranslationField.ts
import { virtual } from "@keystone-6/core/fields";
import { graphql as graphql2 } from "@keystone-6/core";
var labelFromTranslationField = (translationFieldName) => virtual({
  field: graphql2.field({
    resolve: async (item, _, context) => {
      const prisma = context.prisma;
      const data = await prisma.translation.findFirst({
        orderBy: {
          locale: {
            priority: "asc"
          }
        },
        where: {
          translationId: {
            equals: item[translationFieldName] ?? ""
          }
        }
      });
      return data?.text ?? " ";
    },
    type: graphql2.String
  })
});

// src/schema/schema.ts
import { integer, relationship, text } from "@keystone-6/core/fields";
var localeList = ({
  access,
  ui
}) => ({
  access,
  fields: {
    name: text({ isIndexed: "unique", validation: { isRequired: true } }),
    code: text({ isIndexed: "unique", validation: { isRequired: true } }),
    priority: integer({
      db: {
        isNullable: false
      }
    })
  },
  ui
});
var translationList = ({
  access,
  ui
}) => ({
  access,
  fields: {
    locale: relationship({
      many: false,
      ref: "Locale"
    }),
    text: text({ validation: { isRequired: true } }),
    translationId: text({ validation: { isRequired: true } })
  },
  ui
});

// src/schema/schemaExtension.ts
import { graphql as graphql3 } from "@keystone-6/core";

// src/utils/getTranslations.ts
import * as deepl from "deepl-node";
var getTranslations = async (deeplKey, textInEnglish, localesToTranslate, context) => {
  const translator = new deepl.Translator(deeplKey);
  const localesArray = Array.isArray(localesToTranslate) ? localesToTranslate : [localesToTranslate];
  const translations = await localesArray.reduce(async (acc, locale) => {
    const accResolved = await acc;
    try {
      const result = await translator.translateText(
        textInEnglish,
        "en",
        locale,
        { context, preserveFormatting: true }
      );
      const translationText = Array.isArray(result) ? result.map((item) => item.text) : result.text;
      return { ...accResolved, [locale]: translationText };
    } catch (error) {
      console.log(error);
      return accResolved;
    }
  }, Promise.resolve({ en: textInEnglish }));
  return translations;
};

// src/schema/schemaExtension.ts
var translationSchemaExtension = ({
  deeplKey,
  deeplContext
}) => graphql3.extend(() => {
  return {
    query: {
      translatedValues: graphql3.field({
        type: graphql3.JSON,
        args: {
          value: graphql3.arg({ type: graphql3.nonNull(graphql3.String) }),
          locales: graphql3.arg({
            type: graphql3.nonNull(
              graphql3.list(graphql3.nonNull(graphql3.String))
            )
          })
        },
        resolve(_, { value, locales }) {
          return getTranslations(deeplKey, value, locales, deeplContext);
        }
      })
    }
  };
});
export {
  labelFromTranslationField,
  localeList,
  translation,
  translationList,
  translationSchemaExtension
};
