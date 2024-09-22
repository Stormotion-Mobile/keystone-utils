import { graphql } from "@keystone-6/core";
import {
  BaseListTypeInfo,
  FieldTypeFunc,
  fieldType,
  orderDirectionEnum,
} from "@keystone-6/core/types";
import { PrismaClient } from "@prisma/client";
import { Locale, TextFieldConfig, TranslationFieldMeta } from "../utils/types";

export function translationField<ListTypeInfo extends BaseListTypeInfo>({
  isIndexed,
  ui,
  hooks,
  views,
  ...config
}: TextFieldConfig<ListTypeInfo> & {
  views: string;
}): FieldTypeFunc<ListTypeInfo> {
  return () =>
    fieldType({
      index: isIndexed === true ? "index" : isIndexed || undefined,
      kind: "scalar",
      mode: "optional",
      scalar: "String",
    })({
      ...config,
      getAdminMeta(): TranslationFieldMeta {
        return {
          defaultJSON: config.defaultJSON,
          displayMode: ui?.displayMode ?? "input",
          isExpandable: ui?.isExpandable,
          enableTranslator: config.enableTranslator,
        };
      },
      hooks: {
        ...hooks,
        afterOperation: async ({
          operation,
          context,
          originalItem,
          fieldKey,
        }) => {
          if (operation === "delete") {
            const prisma: PrismaClient = context.prisma;
            await prisma.translation.deleteMany({
              where: {
                translationId: {
                  equals: originalItem[fieldKey] as string,
                },
              },
            });
          }
        },
      },
      input: {
        create: {
          arg: graphql.arg({ type: graphql.String }),
          async resolve(rawValue, context) {
            if (!rawValue) {
              return;
            }
            const value = JSON.parse(rawValue);
            const translationId: string = value.translationId;
            const locales: Locale[] = value.locales;
            const translations: Record<string, string> = value?.translations;
            const prisma: PrismaClient = context.prisma;
            try {
              await prisma.translation.createMany({
                data: locales
                  .filter((locale) =>
                    Object.keys(translations).includes(locale.code)
                  )
                  .map((locale) => ({
                    localeId: locale.id,
                    text: translations[locale.code],
                    translationId,
                  })),
              });
            } catch {}
            return translationId;
          },
        },
        orderBy: { arg: graphql.arg({ type: orderDirectionEnum }) },
        update: {
          arg: graphql.arg({ type: graphql.String }),
          async resolve(rawValue, context) {
            if (!rawValue) {
              return;
            }
            const value = JSON.parse(rawValue);
            const translationId: string = value?.translationId;
            const locales: Locale[] = value?.locales;
            const translations: Record<string, string> = value?.translations;
            const prisma: PrismaClient = context.prisma;
            await prisma.$transaction(async (tx: any) => {
              const unusedLocales: Locale[] = [];
              await Promise.all(
                locales.map(async (locale) => {
                  const text = translations[locale.code];
                  if (!text) {
                    await tx.translation.deleteMany({
                      where: {
                        localeId: {
                          equals: locale.id,
                        },
                        translationId,
                      },
                    });
                    return;
                  }
                  const result = await tx.translation.updateMany({
                    data: {
                      text,
                    },
                    where: {
                      localeId: {
                        equals: locale.id,
                      },
                      translationId,
                    },
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
                  translationId,
                })),
              });
            });
            return translationId;
          },
        },
      },
      output: graphql.field({
        async resolve({ value }, _, context, info) {
          const prisma: PrismaClient = context.prisma;

          const locales = await prisma.locale.findMany({
            orderBy: {
              priority: "asc",
            },
          });

          const translations = value
            ? await prisma.translation.findMany({
                where: {
                  translationId: {
                    equals: value,
                  },
                },
              })
            : [];

          const result: Record<string, string> = {};

          translations.forEach(
            ({ localeId, text }: { localeId: string; text: string }) => {
              const locale = locales.find((l: Locale) => l.id === localeId);
              if (!locale) {
                return;
              }
              result[locale.code] = text;
            }
          );

          if (
            info.path.typename !== info.variableValues.listKey &&
            info.path.prev?.typename !== "Mutation"
          ) {
            for (const locale of locales) {
              const translation = translations.find(
                (tr: any) => tr.localeId === locale.id
              );
              if (translation) {
                return translation.text;
              }
            }
            return "";
          }

          return JSON.stringify({
            listKey: info.path.typename,
            locales,
            translationId: value,
            translations: result,
          });
        },
        type: graphql.String,
      }),
      views,
    });
}
