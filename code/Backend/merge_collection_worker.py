from utils.db_models import SessionLocal, Collection, CollectionBook

def merge_duplicate_collections():
    session = SessionLocal()
    # Trouver les doublons (même nom, même owner, même icon)
    duplicates = (
        session.query(Collection.name, Collection.owner, Collection.icon)
        .group_by(Collection.name, Collection.owner, Collection.icon)
        .having(session.query(Collection.id).filter(
            Collection.name == Collection.name,
            Collection.owner == Collection.owner,
            Collection.icon == Collection.icon
        ).count() > 1)
        .all()
    )

    # Alternative plus compatible SQLAlchemy pour trouver les groupes en double
    from sqlalchemy import func
    dup_groups = (
        session.query(Collection.name, Collection.owner, Collection.icon, func.count(Collection.id))
        .group_by(Collection.name, Collection.owner, Collection.icon)
        .having(func.count(Collection.id) > 1)
        .all()
    )

    for name, owner, icon, count in dup_groups:
        # Récupère toutes les collections concernées
        cols = session.query(Collection).filter_by(name=name, owner=owner, icon=icon).all()
        if len(cols) < 2:
            continue
        # On garde la première comme "maître"
        master = cols[0]
        others = cols[1:]
        print(f"Merging {len(cols)} collections for user {owner}: '{name}' {icon}")

        for other in others:
            # Transfère les livres de la collection doublon vers la master
            books = session.query(CollectionBook).filter_by(collection_id=other.id).all()
            for cb in books:
                # Vérifie si le livre est déjà dans la master
                exists = session.query(CollectionBook).filter_by(collection_id=master.id, isbn=cb.isbn).first()
                if not exists:
                    session.add(CollectionBook(collection_id=master.id, isbn=cb.isbn))
            # Supprime la collection doublon et ses liens
            session.query(CollectionBook).filter_by(collection_id=other.id).delete()
            session.delete(other)
        session.commit()
    session.close()
    print("✅ Merge terminé.")

if __name__ == "__main__":
    merge_duplicate_collections()
