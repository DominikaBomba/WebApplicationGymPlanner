/*
  Warnings:

  - You are about to drop the column `stadiumId` on the `post` table. All the data in the column will be lost.
  - You are about to drop the `stadium` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,friendId]` on the table `Friends` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `gymId` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `post` DROP FOREIGN KEY `Post_stadiumId_fkey`;

-- DropIndex
DROP INDEX `Post_stadiumId_fkey` ON `post`;

-- AlterTable
ALTER TABLE `post` DROP COLUMN `stadiumId`,
    ADD COLUMN `gymId` INTEGER NOT NULL;

-- DropTable
DROP TABLE `stadium`;

-- CreateTable
CREATE TABLE `Gym` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `link` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Friends_userId_friendId_key` ON `Friends`(`userId`, `friendId`);

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_gymId_fkey` FOREIGN KEY (`gymId`) REFERENCES `Gym`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
