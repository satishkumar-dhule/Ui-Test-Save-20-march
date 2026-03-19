#!/usr/bin/env python3
"""
DevPrep Vector Index Builder

Builds vector indices for all content types using sentence-transformers.
Supports FAISS for fast similarity search.

Usage:
    python scripts/build-vector-index.py                    # Build all indices
    python scripts/build-vector-index.py --type question   # Build specific type
    python scripts/build-vector-index.py --rebuild         # Force rebuild
"""

import argparse
import json
import os
import sqlite3
import sys
from pathlib import Path

try:
    from sentence_transformers import SentenceTransformer
    import faiss
    import numpy as np
    HAS_DEPENDENCIES = True
except ImportError as e:
    HAS_DEPENDENCIES = False
    print(f"Warning: Missing dependencies - {e}")
    print("Install with: pip install sentence-transformers faiss-cpu numpy")


DEFAULT_MODEL = "all-MiniLM-L6-v2"
DIMENSION = 384

CONTENT_EXTRACTORS = {
    "question": lambda d: f"{d.get('title', '')} {d.get('sections', [{}])[0].get('content', '')} {d.get('sections', [{}])[1].get('content', '')}",
    "flashcard": lambda d: f"{d.get('front', '')} {d.get('back', '')} {d.get('hint', '')}",
    "coding": lambda d: f"{d.get('title', '')} {d.get('description', '')} {d.get('approach', '')}",
    "exam": lambda d: f"{d.get('question', '')} {d.get('explanation', '')} {d.get('domain', '')}",
    "voice": lambda d: f"{d.get('prompt', '')} {' '.join(d.get('keyPoints', []))}",
}


def get_db_connection(db_path: str) -> sqlite3.Connection:
    """Connect to SQLite database."""
    return sqlite3.connect(db_path)


def load_content(db_path: str, content_type: str, status_filter: str = "pending") -> list:
    """Load content from database."""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT id, data FROM generated_content WHERE content_type = ? AND status = ?",
        (content_type, status_filter)
    )
    rows = cursor.fetchall()
    conn.close()
    
    content = []
    for row_id, data_json in rows:
        try:
            data = json.loads(data_json)
            content.append({"id": row_id, "data": data})
        except json.JSONDecodeError:
            print(f"Warning: Invalid JSON for id {row_id}")
            continue
    
    return content


def extract_searchable_text(content: dict, content_type: str) -> str:
    """Extract searchable text from content."""
    extractor = CONTENT_EXTRACTORS.get(content_type)
    if extractor:
        return extractor(content["data"])
    
    data_str = json.dumps(content["data"])
    title = content["data"].get("title", "")
    desc = content["data"].get("description", "")
    question = content["data"].get("question", "")
    
    return f"{title} {desc} {question} {data_str[:500]}"


def build_index(embeddings: np.ndarray) -> faiss.IndexFlatL2:
    """Build FAISS index from embeddings."""
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings.astype('float32'))
    return index


def save_index(index: faiss.IndexFlatL2, metadata: dict, output_dir: Path):
    """Save index and metadata to disk."""
    output_dir.mkdir(parents=True, exist_ok=True)
    
    index_path = output_dir / "index.faiss"
    metadata_path = output_dir / "metadata.json"
    
    faiss.write_index(index, str(index_path))
    
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"  Saved index to {output_dir}")


def update_content_status(db_path: str, content_ids: list, content_type: str):
    """Update status of indexed content."""
    if not content_ids:
        return
    
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    embedding_id_prefix = f"{content_type}s/"
    for content_id in content_ids:
        embedding_id = f"{embedding_id_prefix}{content_id}"
        cursor.execute(
            "UPDATE generated_content SET status = 'approved', embedding_id = ? WHERE id = ?",
            (embedding_id, content_id)
        )
    
    conn.commit()
    conn.close()
    print(f"  Updated {len(content_ids)} content records")


def build_type_index(
    db_path: str,
    vector_dir: Path,
    content_type: str,
    model: SentenceTransformer,
    force_rebuild: bool = False
) -> dict:
    """Build vector index for a specific content type."""
    print(f"\nProcessing {content_type}...")
    
    content = load_content(db_path, content_type)
    
    if not content:
        print(f"  No {content_type} content found")
        return {"count": 0}
    
    texts = []
    ids = []
    
    for item in content:
        text = extract_searchable_text(item, content_type)
        if text.strip():
            texts.append(text)
            ids.append(item["id"])
    
    if not texts:
        print(f"  No valid text to embed")
        return {"count": 0}
    
    print(f"  Embedding {len(texts)} items...")
    embeddings = model.encode(texts, show_progress_bar=True, batch_size=32)
    
    index = build_index(embeddings)
    
    metadata = {
        "content_type": content_type,
        "ids": ids,
        "texts": texts[:10],
        "dimension": embeddings.shape[1],
        "model": DEFAULT_MODEL,
        "count": len(texts),
        "index_type": "faiss-flat-l2"
    }
    
    output_dir = vector_dir / f"{content_type}s"
    save_index(index, metadata, output_dir)
    
    if not force_rebuild:
        update_content_status(db_path, ids, content_type)
    
    return {
        "count": len(texts),
        "dimension": embeddings.shape[1],
        "index_path": str(output_dir)
    }


def build_all_indices(
    db_path: str,
    vector_dir: Path,
    model: SentenceTransformer,
    force_rebuild: bool = False
) -> dict:
    """Build vector indices for all content types."""
    results = {}
    
    content_types = ["question", "flashcard", "coding", "exam", "voice"]
    
    for content_type in content_types:
        try:
            result = build_type_index(
                db_path, vector_dir, content_type, model, force_rebuild
            )
            results[content_type] = result
        except Exception as e:
            print(f"Error building {content_type} index: {e}")
            results[content_type] = {"error": str(e)}
    
    return results


def main():
    parser = argparse.ArgumentParser(description="Build vector indices for DevPrep content")
    parser.add_argument("--db", default="data/devprep.db", help="Path to SQLite database")
    parser.add_argument("--vector-dir", default="data/vectors", help="Directory for vector indices")
    parser.add_argument("--type", choices=["question", "flashcard", "coding", "exam", "voice"], 
                        help="Build index for specific content type")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Sentence transformer model name")
    parser.add_argument("--rebuild", action="store_true", help="Force rebuild existing indices")
    parser.add_argument("--skip-status-update", action="store_true", help="Don't update content status")
    
    args = parser.parse_args()
    
    db_path = Path(args.db)
    vector_dir = Path(args.vector_dir)
    
    if not db_path.exists():
        print(f"Error: Database not found at {db_path}")
        sys.exit(1)
    
    vector_dir.mkdir(parents=True, exist_ok=True)
    
    if not HAS_DEPENDENCIES:
        print("Error: Required dependencies not installed")
        print("Install with: pip install sentence-transformers faiss-cpu numpy")
        sys.exit(1)
    
    print(f"Loading model: {args.model}")
    model = SentenceTransformer(args.model)
    print(f"Model loaded. Dimension: {DIMENSION}")
    
    print(f"\nDatabase: {db_path}")
    print(f"Vector dir: {vector_dir}")
    print(f"Rebuild: {args.rebuild}")
    
    if args.type:
        result = build_type_index(
            db_path, vector_dir, args.type, model, args.rebuild
        )
        print(f"\n{args.type} index built: {result}")
    else:
        results = build_all_indices(
            db_path, vector_dir, model, args.rebuild
        )
        
        print(f"\n{'='*50}")
        print("Index Build Summary")
        print(f"{'='*50}")
        
        total = 0
        for content_type, result in results.items():
            if "error" in result:
                print(f"  {content_type}: ERROR - {result['error']}")
            else:
                print(f"  {content_type}: {result.get('count', 0)} items indexed")
                total += result.get("count", 0)
        
        print(f"\nTotal items indexed: {total}")
        print(f"Indices saved to: {vector_dir}")


if __name__ == "__main__":
    main()
