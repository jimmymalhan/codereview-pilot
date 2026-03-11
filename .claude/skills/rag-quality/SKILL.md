# RAG Quality Skill

**Purpose:** Provide a playbook for designing, implementing, and validating retrieval-augmented systems.

## When to use
- Building or modifying a retrieval pipeline
- Adding new sources to an index
- Responding to hallucination or citation complaints

## Playbook
1. **Data Preparation**
   - Describe source formats (markdown, PDF, database).  
   - Define chunk size and overlap rationales.  
   - Note any preprocessing (cleaning, deduplication).
2. **Indexing & Embeddings**
   - Choose embedding model and parameters.  
   - Document index type (vector database, Faiss, etc.) and versions.  
   - Include test showing embeddings are generated and stored.
3. **Search & Retrieval**
   - Specify similarity metric (cosine, dot).  
   - Provide example queries and expected results.  
   - Add automated tests for recall@k or other relevance metrics if available.
4. **Grounding & Citation**
   - Ensure every generated answer includes a citation linked to the source.  
   - Add validation test that citations actually match the content (e.g., regex match).  
   - Avoid generic statements like "based on docs" without links.
5. **Freshness & Re‑ingestion**
   - Define how often data is re‑indexed and how stale data is detected.  
   - Include a cron/job plan or manual instructions.
6. **Hallucination Mitigation**
   - Add prompt constraints or filters to reject unsupported facts.  
   - Create fallback responses when confidence is low.
   - Test by querying with out-of-index content and verify the system declines.

## Verification
- `rag-ai-engineer` audits the pipeline for completeness.  
- `evidence-reviewer` checks that citations are real and not invented.  
- `distinguished-engineer-reviewer` inspects for long-term scalability and cost.  

## Learning
- After a hallucination or index outage, update this skill with the missing step and log the event in `docs/PROJECT_STATUS.md`.
