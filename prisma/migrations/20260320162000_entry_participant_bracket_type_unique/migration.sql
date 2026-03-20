-- Ensure there are no duplicate participant+bracketType rows before creating the unique index.
DO $$
DECLARE
    duplicate_group_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO duplicate_group_count
    FROM (
        SELECT 1
        FROM "Entry"
        GROUP BY "participantName", "bracketType"
        HAVING COUNT(*) > 1
    ) AS duplicate_groups;

    IF duplicate_group_count > 0 THEN
        RAISE EXCEPTION
            'Cannot add unique constraint on Entry(participantName, bracketType): found % duplicate group(s). Remove duplicates first.',
            duplicate_group_count;
    END IF;
END $$;

-- CreateIndex
CREATE UNIQUE INDEX "Entry_participantName_bracketType_key" ON "Entry"("participantName", "bracketType");
