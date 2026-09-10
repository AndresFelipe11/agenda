-- CreateTable
CREATE TABLE "CutStyle" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'corte',
    "headShapes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imagePath" TEXT,
    "serviceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CutStyle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryPhoto" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "caption" TEXT,
    "styleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GalleryPhoto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GalleryPhoto_tenantId_idx" ON "GalleryPhoto"("tenantId");

ALTER TABLE "CutStyle" ADD CONSTRAINT "CutStyle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GalleryPhoto" ADD CONSTRAINT "GalleryPhoto_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GalleryPhoto" ADD CONSTRAINT "GalleryPhoto_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "CutStyle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
