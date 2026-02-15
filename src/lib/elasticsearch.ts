import { Client } from "@elastic/elasticsearch";
import type {
  MappingProperty,
  QueryDslQueryContainer,
  KnnSearch,
  AggregationsStringTermsBucket,
} from "@elastic/elasticsearch/lib/api/types";

const INDEX_NAME = "course-materials";

let client: Client | null = null;

export function getElasticClient(): Client {
  if (!client) {
    const url = process.env.ELASTICSEARCH_URL;
    const apiKey = process.env.ELASTICSEARCH_API_KEY;

    if (!url || !apiKey) {
      throw new Error(
        "Missing ELASTICSEARCH_URL or ELASTICSEARCH_API_KEY environment variables"
      );
    }

    client = new Client({
      node: url,
      auth: { apiKey },
    });
  }
  return client;
}

export async function ensureIndex(): Promise<void> {
  const es = getElasticClient();
  const exists = await es.indices.exists({ index: INDEX_NAME });
  if (!exists) {
    await es.indices.create({
      index: INDEX_NAME,
      mappings: {
        properties: {
          content: { type: "text" } as MappingProperty,
          embedding: {
            type: "dense_vector",
            dims: 1024,
            index: true,
            similarity: "cosine",
          } as MappingProperty,
          source_filename: { type: "keyword" } as MappingProperty,
          chunk_index: { type: "integer" } as MappingProperty,
          course_name: { type: "keyword" } as MappingProperty,
          created_at: { type: "date" } as MappingProperty,
        },
      },
    });
  }
}

export interface SearchResult {
  content: string;
  source_filename: string;
  chunk_index: number;
  course_name: string;
  score: number;
}

export async function hybridSearch(
  queryText: string,
  queryEmbedding: number[],
  courseName?: string,
  k: number = 5
): Promise<SearchResult[]> {
  const es = getElasticClient();

  const filter: QueryDslQueryContainer[] | undefined = courseName
    ? [{ term: { course_name: courseName } }]
    : undefined;

  const knn: KnnSearch = {
    field: "embedding",
    query_vector: queryEmbedding,
    k,
    num_candidates: k * 10,
    ...(filter ? { filter } : {}),
  };

  const query: QueryDslQueryContainer = {
    bool: {
      must: [{ match: { content: queryText } }],
      ...(filter ? { filter } : {}),
    },
  };

  const response = await es.search({
    index: INDEX_NAME,
    size: k,
    query,
    knn,
    rank: { rrf: {} },
  });

  const hits = response.hits.hits;
  return hits.map((hit) => {
    const source = hit._source as Record<string, unknown>;
    return {
      content: source.content as string,
      source_filename: source.source_filename as string,
      chunk_index: source.chunk_index as number,
      course_name: source.course_name as string,
      score: hit._score ?? 0,
    };
  });
}

export async function aggregateCourses(): Promise<
  { name: string; doc_count: number }[]
> {
  const es = getElasticClient();

  const exists = await es.indices.exists({ index: INDEX_NAME });
  if (!exists) return [];

  const response = await es.search({
    index: INDEX_NAME,
    size: 0,
    aggs: {
      courses: {
        terms: {
          field: "course_name",
          size: 100,
        },
      },
    },
  });

  const buckets = (
    response.aggregations?.courses as {
      buckets: AggregationsStringTermsBucket[];
    }
  )?.buckets;

  if (!buckets || !Array.isArray(buckets)) return [];

  return buckets.map((bucket) => ({
    name: bucket.key as string,
    doc_count: bucket.doc_count,
  }));
}

export async function deleteBySourceAndCourse(
  sourceFilename: string,
  courseName: string
): Promise<number> {
  const es = getElasticClient();

  const exists = await es.indices.exists({ index: INDEX_NAME });
  if (!exists) return 0;

  const response = await es.deleteByQuery({
    index: INDEX_NAME,
    query: {
      bool: {
        must: [
          { term: { source_filename: sourceFilename } },
          { term: { course_name: courseName } },
        ],
      },
    },
    refresh: true,
  });

  return (response.deleted as number) ?? 0;
}

export { INDEX_NAME };
