import { virtual } from "@keystone-6/core/fields";
import { graphql } from "@keystone-6/core";
import { PrismaClient } from "@prisma/client";
import { BaseListTypeInfo, FieldTypeFunc } from "@keystone-6/core/types";

export const labelFromTranslationField = <
  ListTypeInfo extends BaseListTypeInfo
>(
  translationFieldName: ListTypeInfo["fields"]
): FieldTypeFunc<ListTypeInfo> =>
  virtual({
    field: graphql.field({
      resolve: async (item, _, context) => {
        const prisma: PrismaClient = context.prisma;
        const data = await prisma.translation.findFirst({
          orderBy: {
            locale: {
              priority: "asc",
            },
          },
          where: {
            translationId: {
              equals: item[translationFieldName] ?? "",
            },
          },
        });
        return data?.text ?? " ";
      },
      type: graphql.String,
    }),
  });
