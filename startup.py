import subprocess

# Port 1: 8000
# Port 2: 9000
cmd1 = "sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 9000"
cmd2 = "sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 443 -j REDIRECT --to-port 9000"
cmd3 = "export EMOTION_KEY=9f539c1c51574a29be83cc18c62f6b07"

subprocess.call([cmd1], shell=True)
subprocess.call([cmd2], shell=True)
subprocess.call([cmd3], shell=True)
