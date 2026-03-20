UPDATE "Game"
SET "status" = 'final'
WHERE LOWER("status") = 'resolved';
