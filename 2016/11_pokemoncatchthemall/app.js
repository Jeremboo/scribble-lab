const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

new Promise((resolve, reject) => {
  const pokemons = [];
  console.log('fetchGenerations...');
  const fetchGenerations = (id = 1) => {
    fetch(`http://pokeapi.co/api/v2/generation/${id}/`)
    .then((res) => res.json())
    .then((data) => {
      console.log(`${id}...`);
      pokemons.push(...(data.pokemon_species.map(p => ({
        name: p.name,
        gif: `https://img.pokemondb.net/sprites/black-white/anim/normal/${p.name}.gif`,
        png: `https://img.pokemondb.net/sprites/black-white/normal/${p.name}.png`,
      }))));
      if( id < 5) {
        fetchGenerations(id + 1);
        return;
      }
      resolve(pokemons);
    });
  }
  fetchGenerations();
}).then(data => {
  console.log(data);
  const pokemon = document.createElement("img");
  pokemon.src = data[getRandomInt(0, data.length - 1)].gif;
  document.body.appendChild(pokemon);
});
