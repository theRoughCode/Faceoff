<template>
  <div id="app" class="grid-x align-top" style="height: 100vh;">
  <div class="large-12 cell">
    <div class="large-12 cell" style="height: auto">
    <div class="grid-x">

      <div class="top-bar" style="width: 100%" id="responsive-menu">
        <div class="top-bar-left">
          <ul class="menu">
            <li><a href="#" class="button">Quit Game</a></li>
            <li><a href="#" class="button">Browse Games</a></li>
          </ul>
        </div>
        <div class="top-bar-right">
          <ul class="menu">
            <li>
              <a href="#" class="button">Logout</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="large-12 cell">
      <div class="grid-x align-middle">
        <div class="medium-3 cell leaderboard" style="padding: 10px;">
          <h4 class="text-center">Leaderboard</h4>
          <table class="responsive text-center" style="width: 100%">
              <players></players>
          </table>
        </div>
        <div class="medium-9 cell text-center" style="border-radius: 20px; height: 60vh;">
          <div class="vidstream"><img src="http://via.placeholder.com/100x100"></div>
          <object data="https://www.youtube.com/embed/5sqPu-x-_tw" style="width: 90%; height: 100%;border-radius: 20px;margin: 10px; border:2px solid rgb(255, 51, 51);"></object>
        </div>
      </div>
    </div>

    
    </div>
  </div>

    <div class="flex-child-auto align-stretch" style="">
      <div class="grid-x">
        <div class="small-12 cell text-middle" style="">
          <ul class="player-list" style="list-style-type: none">
            <li><img src="http://via.placeholder.com/40x40" ></li>
          </ul>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import players from './components/players'
import './components/css/foundation.min.css'
import './components/css/custom_faceoff.css'
import './components/css/responsive-tables.css'
import './components/css/foundation.min.css'
import './components/js/jquery.js'
import "./components/js/what-input.js"
import "./components/js/foundation.min.js"
import "./components/js/custom_faceoff.js"

export default {
  name: 'app',
  components: {
    players
  }
}
</script>

<style>

</style>