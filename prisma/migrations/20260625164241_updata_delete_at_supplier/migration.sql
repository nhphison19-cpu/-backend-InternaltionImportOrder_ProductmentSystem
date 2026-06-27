/*
  Warnings:

  - Added the required column `password` to the `employees` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "password" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "deleteAt" TIMESTAMP(3);
