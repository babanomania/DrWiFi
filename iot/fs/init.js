load('api_timer.js');
load('api_http.js');
load('api_shadow.js');
load('api_mqtt.js');
load('api_config.js');

let state = { "state": { "reported" : { "network_health": "Good"} } };   

Shadow.addHandler(function(event, obj) {
    if (event === 'CONNECTED') {
      // Connected to shadow - report our current state.
      Shadow.update(0, state);

    } else if (event === 'UPDATE_DELTA') {
      // Once we've done synchronising with the shadow, report our state.
      Shadow.update(0, state);
    }
  });

let ping_every_min = Cfg.get('ping_every_min'); 
let ping_every_ms = ping_every_min * 60 * 1000;
let ping_site =  Cfg.get('ping_url');

let start_time = Timer.now();
Timer.set(ping_every_ms, Timer.REPEAT, function() {
  
    start_time = Timer.now();
    HTTP.query({
        url: ping_site,
        success: function(body, full_http_msg){ 
		
            print("internet connected"); 
            let end_time = Timer.now();
            let end_time_hr = Timer.fmt("%F %I:%M%p %Z", end_time);
            let time_taken = end_time - start_time;
            
            if( time_taken > 1 ) {
              state = { "state": { "reported" : { "network_health": "Bad", "last_seen": end_time_hr, "pingtime": time_taken } } };
            }else {
              state = { "state": { "reported" : { "network_health": "Good", "last_seen": end_time_hr, "pingtime": time_taken } } };
            }
			
            print(JSON.stringify(state));
            Shadow.update(0, state);
            MQTT.pub('device1/shadow/update', JSON.stringify(state), 1);
        },
        error: function(err){ 
            print(err);
            print("internet not connected");
        },  // Optional
    });

}, null);