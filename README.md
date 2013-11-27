notinator
=========

Save and retrieve notes.

Save:
  curl http://notiator.thejml.info/add/<noteName> -d '<note here>' -H "Header: application/json" (or text)

Retrieve:
  curl http://notiator.thejml.info/note/<noteName>

Delete:
  curl http://notiator.thejml.info/delete/<noteName>

Update
  curl http://notiator.thejml.info/update/<noteName> -d '<note here>' -H "Header: application/json" (or text)

