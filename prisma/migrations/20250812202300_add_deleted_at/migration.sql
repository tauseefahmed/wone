-- AlterTable
ALTER TABLE `pages` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `posts` ADD COLUMN `deletedAt` DATETIME(3) NULL;
