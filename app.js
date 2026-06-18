function slide(trackId, direction) {
    const track = document.getElementById(trackId);

    track.scrollBy({
        left: direction * 1200,
        behavior: 'smooth'
    });
}

const client = contentful.createClient({
  space: "tx11zsju5n7c",
  accessToken: "1gi_iikDoQygU8FDuM4__2GE6YWb4iJMrOYLUCsyviQ"
});

client.getEntries({
  content_type: "literaryEntry",
  limit: 1
}).then((res) => {
  console.log(res.items);
});
