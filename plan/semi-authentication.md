Semi-authentication system:

This system works aloneside the main authentication system, provide a safe way for accountless users to access information.

General:

use only sessions, use constant ping (or anything that will work better/sth. similar) to keep the connection alive (to check if the user tab is still open), if the connection is not alive for a given amount of time (30 sec), then the session token will be deleted. 

login: input a username, then send a timed (1min) validation code (numbers and capital letters) to the user via the notification system. the code will be inputed and checked, if pass, then generate token and login. use ping to keep cnnection alive.


Advice: 



Tech detail:
