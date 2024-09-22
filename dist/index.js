"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  labelFromTranslationField: () => labelFromTranslationField,
  localeList: () => localeList,
  translation: () => translation,
  translationList: () => translationList,
  translationSchemaExtension: () => translationSchemaExtension
});
module.exports = __toCommonJS(src_exports);

// src/field/translationField.ts
var import_core = require("@keystone-6/core");
var import_types = require("@keystone-6/core/types");
function translationField({
  isIndexed,
  ui,
  hooks,
  views,
  ...config
}) {
  return () => (0, import_types.fieldType)({
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
        enableTranslation: config.enableTranslation
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
        arg: import_core.graphql.arg({ type: import_core.graphql.String }),
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
      orderBy: { arg: import_core.graphql.arg({ type: import_types.orderDirectionEnum }) },
      update: {
        arg: import_core.graphql.arg({ type: import_core.graphql.String }),
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
    output: import_core.graphql.field({
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
      type: import_core.graphql.String
    }),
    views
  });
}

// src/field/index.ts
function translation(config = {}) {
  return translationField({ ...config, views: "./translation-field/views" });
}

// src/field/labelFromTranslationField.ts
var import_fields = require("@keystone-6/core/fields");
var import_core2 = require("@keystone-6/core");
var labelFromTranslationField = (translationFieldName) => (0, import_fields.virtual)({
  field: import_core2.graphql.field({
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
    type: import_core2.graphql.String
  })
});

// src/schema/schema.ts
var import_fields2 = require("@keystone-6/core/fields");
var localeList = ({
  access,
  ui
}) => ({
  access,
  fields: {
    name: (0, import_fields2.text)({ isIndexed: "unique", validation: { isRequired: true } }),
    code: (0, import_fields2.text)({ isIndexed: "unique", validation: { isRequired: true } }),
    priority: (0, import_fields2.integer)({
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
    locale: (0, import_fields2.relationship)({
      many: false,
      ref: "Locale"
    }),
    text: (0, import_fields2.text)({ validation: { isRequired: true } }),
    translationId: (0, import_fields2.text)({ validation: { isRequired: true } })
  },
  ui
});

// src/schema/schemaExtension.ts
var import_core3 = require("@keystone-6/core");

// src/utils/getTranslations.ts
var deepl = __toESM(require("deepl-node"));
var getTranslations = async (deeplKey, textInEnglish, localesToTranslate, context) => {
  const translator = new deepl.Translator(deeplKey);
  const localesArray = Array.isArray(localesToTranslate) ? localesToTranslate : [localesToTranslate];
  const translations = await localesArray.reduce(async (acc, locale) => {
    const resolved = await acc;
    try {
      const result = await translator.translateText(
        textInEnglish,
        "en",
        locale,
        { context, preserveFormatting: true }
      );
      const translationText = Array.isArray(result) ? result.map((item) => item.text) : result.text;
      return { ...resolved, [locale]: translationText };
    } catch (error) {
      console.log(error);
      return resolved;
    }
  }, Promise.resolve({ en: textInEnglish }));
  return translations;
};

// src/schema/schemaExtension.ts
var translationSchemaExtension = ({
  deeplKey,
  deeplContext
}) => import_core3.graphql.extend(() => {
  return {
    query: {
      translatedValues: import_core3.graphql.field({
        type: import_core3.graphql.JSON,
        args: {
          value: import_core3.graphql.arg({ type: import_core3.graphql.nonNull(import_core3.graphql.String) }),
          locales: import_core3.graphql.arg({
            type: import_core3.graphql.nonNull(
              import_core3.graphql.list(import_core3.graphql.nonNull(import_core3.graphql.String))
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  labelFromTranslationField,
  localeList,
  translation,
  translationList,
  translationSchemaExtension
});
