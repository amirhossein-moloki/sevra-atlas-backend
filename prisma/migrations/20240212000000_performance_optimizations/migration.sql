-- Create CityStats table
CREATE TABLE "geo_citystats" (
    "cityId" BIGINT NOT NULL,
    "salonCount" INTEGER NOT NULL DEFAULT 0,
    "artistCount" INTEGER NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "geo_citystats_pkey" PRIMARY KEY ("cityId")
);

-- Add foreign key for CityStats
ALTER TABLE "geo_citystats" ADD CONSTRAINT "geo_citystats_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add FTS columns
ALTER TABLE "Salon" ADD COLUMN "search_vector" tsvector;
CREATE INDEX "salon_search_idx" ON "Salon" USING GIN ("search_vector");

ALTER TABLE "Artist" ADD COLUMN "search_vector" tsvector;
CREATE INDEX "artist_search_idx" ON "Artist" USING GIN ("search_vector");

ALTER TABLE "blog_post" ADD COLUMN "search_vector" tsvector;
CREATE INDEX "post_search_idx" ON "blog_post" USING GIN ("search_vector");

-- Create triggers for FTS
CREATE OR REPLACE FUNCTION salon_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.description, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER salon_search_vector_trigger BEFORE INSERT OR UPDATE ON "Salon"
FOR EACH ROW EXECUTE FUNCTION salon_search_vector_update();

CREATE OR REPLACE FUNCTION artist_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW."fullName", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.bio, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER artist_search_vector_trigger BEFORE INSERT OR UPDATE ON "Artist"
FOR EACH ROW EXECUTE FUNCTION artist_search_vector_update();

CREATE OR REPLACE FUNCTION post_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.excerpt, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.content, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_search_vector_trigger BEFORE INSERT OR UPDATE ON "blog_post"
FOR EACH ROW EXECUTE FUNCTION post_search_vector_update();
