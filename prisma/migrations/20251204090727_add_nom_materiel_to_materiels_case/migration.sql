/*
  Warnings:

  - You are about to drop the column `token_hash` on the `revoked_tokens` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[jti]` on the table `revoked_tokens` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `type_client` on the `clients` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `nom_materiel` to the `materiels_case` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jti` to the `revoked_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('EXTERNE', 'INTERNE');

-- DropIndex
DROP INDEX "revoked_tokens_token_hash_key";

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "type_client",
ADD COLUMN     "type_client" "ClientType" NOT NULL;

-- AlterTable
ALTER TABLE "materiels_case" ADD COLUMN     "nom_materiel" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "revoked_tokens" DROP COLUMN "token_hash",
ADD COLUMN     "jti" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "revoked_tokens_jti_key" ON "revoked_tokens"("jti");
