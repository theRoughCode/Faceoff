<template>
	<tbody>
		<tr>
			<th>Rank</th>
			<th>Name</th>
			<th>Score</th>
		</tr>
		<tr v-for="user in users">
			<td style="text-align: left">Rank</td>
			<td style="text-align: center">{{user.name}}</td>
			<td style="text-align: right;">{{user.score}}</td>
		</tr>
	</tbody>
</template>

<script>
var playerPos = [];
	export default {
		name: 'players',
		props: {
			msg: {
				type: String,
				default: 'Foobar'
			}
		},
		data() {
			return {
				users: [
					{
						name: 'Player 1',
						score: 214,
					},
					{
						name: 'Player 2',
						score: 217,
					},
					{
						name: 'Player 3',
						score: 234,
					},
					{
						name: 'Player 4',
						score: 400,
					}
				]
			}
		},
		methods: {

		}

	}
</script>

<style scoped>
	
</style>