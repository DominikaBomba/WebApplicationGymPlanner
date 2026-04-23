/*
  Warnings:

  - A unique constraint covering the columns `[postId,participantId]` on the table `Participants` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `address` to the `Gym` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `Gym` table without a default value. This is not possible if the table is not empty.
  - Added the required column `additionalInfo` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TrainingDuration" AS ENUM ('LESS_THAN_1_HOUR', 'FROM_1_TO_2_HOURS', 'MORE_THAN_2_HOURS');

-- CreateEnum
CREATE TYPE "FriendStatus" AS ENUM ('PENDING', 'ACCEPTED');

-- AlterTable
ALTER TABLE "Friends" ADD COLUMN     "status" "FriendStatus" NOT NULL DEFAULT 'ACCEPTED';

-- AlterTable
ALTER TABLE "Gym" ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "city" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "additionalInfo" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxParticipants" INTEGER,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "trainingDuration" "TrainingDuration" NOT NULL DEFAULT 'FROM_1_TO_2_HOURS';

-- CreateIndex
CREATE UNIQUE INDEX "Participants_postId_participantId_key" ON "Participants"("postId", "participantId");
