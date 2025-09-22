-- Add OWNER to ProjectAccess enum
ALTER TYPE "ProjectAccess" ADD VALUE 'OWNER';

-- Update existing project creator records to have OWNER access
UPDATE "userToProject"
SET "access" = 'OWNER'
WHERE "id" IN (
    SELECT utp."id"
    FROM "userToProject" utp
    JOIN "Project" p ON utp."projectId" = p."id"
    JOIN "Organization" o ON p."organizationId" = o."id"
    WHERE utp."userId" = o."ownerId"
);
