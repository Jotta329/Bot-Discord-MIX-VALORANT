const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

let players = [];
const maps = ['Ascent', 'Bind', 'Haven', 'Split', 'Icebox', 'Breeze', 'Fracture', 'Lotus', 'Sunset'];
let teams = { team1: [], team2: [] };
let selectedMap = '';
let captains = [];

module.exports.run = async (client, message, args) => {
  if (args[0] === 'start') {
    // Botões para escolher os capitães
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('choose_capitain_1')
        .setLabel('Escolher Capitão 1')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('choose_capitain_2')
        .setLabel('Escolher Capitão 2')
        .setStyle(ButtonStyle.Primary)
    );

    await message.channel.send({
      content: 'Clique para começar a escolher os capitães!',
      components: [row],
    });

    // Filtro para qualquer pessoa que interaja
    const filter = i => !i.user.bot; // Não restringe a ID, permite que qualquer pessoa clique
    const collector = message.channel.createMessageComponentCollector({
      filter,
      componentType: ComponentType.Button,
      time: 60000
    });

    collector.on('collect', async i => {
      // Escolher o Capitão 1
      if (i.customId === 'choose_capitain_1') {
        await i.update({ content: 'Escolha o Capitão 1 (digite o nome):', components: [] });

        // Coletor para o Capitão 1
        const captainFilter = response => response.author.id === i.user.id && !response.author.bot;
        const captainCollector = message.channel.createMessageCollector({ captainFilter, max: 1, time: 60000 });

        captainCollector.on('collect', response => {
          const captainName = response.content.trim();
          captains.push(captainName);
          message.channel.send(`${captainName} foi escolhido como Capitão 1.`);
          captainCollector.stop();
          
          // Botão para escolher o Capitão 2
          const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('choose_capitain_2')
              .setLabel('Escolher Capitão 2')
              .setStyle(ButtonStyle.Primary)
          );

          message.channel.send({
            content: 'Agora, escolha o Capitão 2 (digite o nome):',
            components: [row2],
          });
        });
      }

      // Escolher o Capitão 2
      if (i.customId === 'choose_capitain_2') {
        await i.update({ content: 'Escolha o Capitão 2 (digite o nome):', components: [] });

        // Coletor para o Capitão 2
        const captainFilter = response => response.author.id === i.user.id && !response.author.bot;
        const captainCollector2 = message.channel.createMessageCollector({ captainFilter, max: 1, time: 60000 });

        captainCollector2.on('collect', response => {
          const captainName2 = response.content.trim();
          if (captainName2 !== captains[0]) {
            captains.push(captainName2);
            message.channel.send(`${captainName2} foi escolhido como Capitão 2.`);
            captainCollector2.stop();

            // Botão para adicionar jogadores
            const row3 = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('add_player')
                .setLabel('Adicionar Jogadores')
                .setStyle(ButtonStyle.Primary)
            );

            message.channel.send({
              content: 'Agora, vamos adicionar os jogadores. Clique para adicionar o primeiro jogador.',
              components: [row3],
            });
          } else {
            message.channel.send('O Capitão 2 não pode ser o mesmo que o Capitão 1. Tente novamente.');
          }
        });
      }

      // Adicionar jogadores
      if (i.customId === 'add_player') {
        // Coletor para adicionar jogadores
        if (players.length < 8) {
          // Enviar o botão novamente para adicionar jogadores
          const row4 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('add_player')
              .setLabel(`Adicionar ${players.length + 1}º jogador`)
              .setStyle(ButtonStyle.Primary)
          );
          await i.update({ content: `Digite o nome do ${players.length + 1}º jogador:`, components: [row4] });

          const playerFilter = response => response.author.id === i.user.id && !response.author.bot;
          const playerCollector = message.channel.createMessageCollector({ playerFilter, max: 1, time: 60000 });

          playerCollector.on('collect', response => {
            const playerName = response.content.trim();
            if (!players.includes(playerName) && players.length < 8) {
              players.push(playerName);
              message.channel.send(`${playerName} foi adicionado à lista de jogadores.`);

              // Verifica se todos os jogadores foram adicionados
              if (players.length < 8) {
                message.channel.send(`Clique para adicionar o ${players.length + 1}º jogador.`);
              } else {
                message.channel.send(`Todos os jogadores foram adicionados! Vamos escolher o mapa.`);
                
                // Botão para escolher o mapa
                const row5 = new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setCustomId('choose_map')
                    .setLabel('Escolher Mapa')
                    .setStyle(ButtonStyle.Primary)
                );

                message.channel.send({
                  content: 'Clique para escolher o mapa:',
                  components: [row5],
                });
              }
            } else {
              message.channel.send('Jogador já adicionado ou máximo de jogadores atingido.');
            }
          });
        }
      }

      // Escolher mapa
      if (i.customId === 'choose_map') {
        // Coletor para escolher o mapa
        await i.update({ content: 'Escolha o mapa da partida (digite o nome):', components: [] });

        const mapFilter = response => response.author.id === i.user.id && !response.author.bot;
        const mapCollector = message.channel.createMessageCollector({ mapFilter, max: 1, time: 60000 });

        mapCollector.on('collect', mapResponse => {
          const mapChoice = mapResponse.content.trim();
          if (maps.includes(mapChoice)) {
            selectedMap = mapChoice;
            message.channel.send(`O mapa escolhido é ${selectedMap}. Vamos dividir os jogadores em times.`);

            // Sorteio aleatório para dividir os jogadores em 2 times
            players.sort(() => Math.random() - 0.5); // Embaralha a lista de jogadores
            teams.team1 = players.slice(0, 4); // Time 1
            teams.team2 = players.slice(4, 8); // Time 2

            // Exibir os times
            message.channel.send(`**Time 1 (Capitão: ${captains[0]})**: ${teams.team1.join(', ')}`);
            message.channel.send(`**Time 2 (Capitão: ${captains[1]})**: ${teams.team2.join(', ')}`);

            // Resetar para nova rodada
            players = [];
            teams = { team1: [], team2: [] };
            selectedMap = '';
            captains = [];
          } else {
            message.channel.send('Mapa inválido! Escolha um mapa válido.');
          }
        });
      }
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        message.channel.send('Tempo esgotado para interagir com o menu.');
      }
    });

  }
};

module.exports.help = {
  name: 'mix',
};
