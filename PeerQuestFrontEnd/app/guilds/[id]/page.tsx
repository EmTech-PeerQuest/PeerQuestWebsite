// Example: Fetch a single guild by ID
useEffect(() => {
  fetch(`http://localhost:8000/guilds/${id}/`)
    .then(res => res.json())
    .then(data => setGuild(data))
}, [id])