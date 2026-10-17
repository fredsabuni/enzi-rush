import numpy as np, json, wave
# Sound is driven by events.json (written by render.mjs): scene times, cue list, envelopes.
SR=44100
D=json.load(open('events.json')); EV=D['events']; ROLL=np.array(D['roll']); RUSH=np.array(D['rush']); M=D['meta']
DUR=M['DUR']; N=int(SR*DUR); SC={s['id']:s for s in M['scenes']}
STOPS=[(s['start'],s['end']) for s in M['scenes'] if s['kind']=='stop']
music=np.zeros(N); sfx=np.zeros(N); rng=np.random.default_rng(7)
def tt(d): return np.arange(int(SR*d))/SR
def env(n,a=.005,r=.1): t=np.arange(n)/SR; return np.minimum(1,t/a)*np.exp(-t/r)
def add(buf,t0,sig,g=1.):
    i=int(t0*SR)
    if i>=N or i+len(sig)<0: return
    if i<0: sig=sig[-i:]; i=0
    j=min(N,i+len(sig)); buf[i:j]+=sig[:j-i]*g
def sq(f,d,duty=.5): t=tt(d); return np.where((t*f)%1<duty,1.,-1.)
def tri(f,d): t=tt(d); return 2*np.abs(2*((t*f)%1)-1)-1
def sine(f,d): return np.sin(2*np.pi*f*tt(d))
def nf(m): return 440*2**((m-69)/12)
def noise(d): return rng.uniform(-1,1,int(SR*d))
def lp(x,k): return np.convolve(x,np.ones(k)/k,'same')
def epiano(m,d):
    x=tt(d); f=nf(m); return (np.sin(2*np.pi*f*x)+.3*np.sin(2*np.pi*2*f*x)*np.exp(-x*6))*np.exp(-x*2.2)
def kick(t,g): x=tt(.22); f=110*np.exp(-x*28)+46; add(music,t,np.sin(2*np.pi*np.cumsum(f)/SR)*env(len(x),.001,.12),g)
def lofi(a,b,g=1.0,bpm=84):  # mellow keys + soft beat
    B=60/bpm; k=0
    while a+k*B<b-.1:
        t=a+k*B; root,ch=[(48,[64,67,71,74]),(45,[64,67,72,76]),(41,[64,69,72,76]),(43,[62,65,71,74])][(k//2)%4]
        if k%2==0:
            for i,m in enumerate(ch): add(music,t+i*.02,epiano(m,B*2),.06*g)
            add(music,t,sine(nf(root-12),B*2)*np.exp(-tt(B*2)*1.2),.18*g)
        x=tt(.2); f=90*np.exp(-x*20)+45; add(music,t,np.sin(2*np.pi*np.cumsum(f)/SR)*env(len(x),.002,.1),.25*g)
        if k%2: add(music,t,lp(noise(.12),3)*env(int(.12*SR),.001,.04),.08*g)
        add(music,t+B/2,np.diff(np.concatenate([[0],noise(.03)]))*env(int(.03*SR),.001,.01),.05*g)
        k+=1
BPM=132; B=60/BPM; S=B/4
prog=[(48,[60,64,67]),(45,[60,64,69]),(41,[60,65,69]),(43,[59,62,67])]
lead=[76,79,81,79, 76,74,72,74, 76,79,84,81, 79,76,74,72]
# --- home: lo-fi in the man cave (lighter during the chat + thinking)
lofi(0, SC['kariakoo']['start']-.1, .9)
# --- street groove
t=SC['kariakoo']['start']-.05; end=SC['arrive']['end']-.35; step=0
while t<end:
    bar=step//16; root,ch=prog[bar%4]; s16=step%16
    duck=any(a-.1<=t<b-.1 for a,b in STOPS); g=.55 if duck else 1.0
    if s16 in (0,8) or (s16==10 and not duck): kick(t,.55*g)
    if s16 in (4,12) and not duck: add(music,t,lp(noise(.16),2)*env(int(.16*SR),.001,.045),.2); add(music,t,sine(200,.12)*env(int(.12*SR),.001,.05),.15)
    n=np.diff(np.concatenate([[0],noise(.04)])); add(music,t,n*env(len(n),.002,.012),(.07 if s16%2 else .04)*g)
    if s16 in (0,3,6,10,12): add(music,t,sine(1700,.03)*env(int(.03*SR),.0005,.01),.05*g)
    if s16 in (0,3,7,8,11,14):
        m=root-12+(12 if s16 in (7,14) else 0); add(music,t,(tri(nf(m),S*1.8)*.8+sq(nf(m),S*1.8,.3)*.2)*env(int(S*1.8*SR),.003,.14),.2*g)
    if s16 in (2,6,10,14):
        for m in ch: add(music,t,sq(nf(m+12),S*.9,.5)*env(int(S*.9*SR),.002,.04),.02*g)
    if bar>=2 and s16%2==0 and not duck:
        m=lead[(s16//2+(bar%2)*8)%16]
        if not (bar%4==3 and s16>=12): add(music,t,sq(nf(m),S*1.7,.25)*env(int(S*1.7*SR),.003,.1),.06)
    t+=S; step+=1
# --- café: lo-fi again, with a crowd murmur
lofi(SC['cafe']['start']+.1, SC['endcard']['start'], 1.0)
cs,ce=SC['cafe']['start'],SC['endcard']['start']; mur=lp(noise(ce-cs),25); mur=mur/np.max(np.abs(mur))*(.5+.5*np.abs(np.sin(2*np.pi*.7*tt(ce-cs))))
add(sfx,cs,mur*np.minimum(1,tt(ce-cs)/.4)*np.minimum(1,(ce-cs-tt(ce-cs))/.4),.07)
# --- end card chords
e0=SC['endcard']['start']
for i,(root,ch) in enumerate([(48,[60,64,67,71]),(41,[60,65,69,72]),(43,[59,62,67,74])]):
    t=e0+i*1.35; d=2.4; e=np.minimum(1,tt(d)/.15)*np.exp(-tt(d)*.9)
    for m in ch: add(music,t,epiano(m+12,d)*.8+tri(nf(m),d)*e*.25,.07)
    add(music,t,sine(nf(root-12),d)*e,.2)
# --- hoverboard hum
if M.get('hover'):
    a,b=M['hover']; d=b-a; x=tt(d); hum=(np.sin(2*np.pi*(110+6*np.sin(2*np.pi*3*x))*x)+.4*np.sin(2*np.pi*220.5*x))*np.minimum(1,x/.2)*np.minimum(1,(d-x)/.3)
    add(sfx,a,hum,.07)
# --- rolling wheels (continuous)
r=np.interp(np.arange(N)/SR,np.arange(len(ROLL))/100,ROLL)
wn=lp(noise(DUR),40); wn=wn/np.max(np.abs(wn)); rumble=wn*(.6+.4*np.sin(2*np.pi*9*np.arange(N)/SR))
sfx+=rumble*r*.12
rs=np.interp(np.arange(N)/SR,np.arange(len(RUSH))/100,RUSH)
jet=lp(noise(DUR),6); sfx+=jet/np.max(np.abs(jet))*rs*.12
# --- events
PITCH={'ENZI':(78,1.0),'BARAKA':(55,.9),'MZEE JUMA':(50,.8),'NEEMA':(72,.9),'BARISTA':(64,.8)}
last=-9; streak=0
for e in EV:
    t,k=e['t'],e['type']
    if k=='bean':
        streak=streak+1 if t-last<.2 else 0; last=t; f=nf(84+[0,2,4,5,7,9,11,12][streak%8])
        sig=np.concatenate([sq(f,.03),sq(f*1.335,.07)]); add(sfx,t,sig*env(len(sig),.001,.06),.055)
    elif k=='ollie':
        add(sfx,t,lp(noise(.05),2)*env(int(.05*SR),.0005,.01),.5); add(sfx,t,sine(320,.06)*env(int(.06*SR),.0005,.02),.3)
        x=tt(.25); add(sfx,t+.02,np.sin(2*np.pi*np.cumsum(400+1100*x/.25)/SR)*env(len(x),.002,.1),.08)
    elif k=='land':
        add(sfx,t,lp(noise(.08),3)*env(int(.08*SR),.0005,.02),.45); x=tt(.12); add(sfx,t,np.sin(2*np.pi*np.cumsum(90*np.exp(-x*20)+50)/SR)*env(len(x),.001,.05),.4)
    elif k=='skid':
        d=.45; n=noise(d); n=n-lp(n,12); add(sfx,t,n*np.sin(np.pi*tt(d)/d)*(1+.5*np.sin(2*np.pi*30*tt(d))),.12)
    elif k=='horn':
        for i in (0,.22):
            d=.16; x=tt(d); s=np.sign(np.sin(2*np.pi*420*x))+np.sign(np.sin(2*np.pi*530*x)); add(sfx,t+i,lp(s,6)*np.minimum(1,x/.01)*np.minimum(1,(d-x)/.02),.07)
    elif k=='wake':
        x=tt(.35); add(sfx,t,np.sin(2*np.pi*np.cumsum(200+700*np.sin(np.pi*x/.35*0.5))/SR)*env(len(x),.002,.2),.15)
        for i,m in enumerate([84,88,91]): add(sfx,t+.05+i*.05,sq(nf(m),.08,.25)*env(int(.08*SR),.001,.05),.06)
    elif k=='tap':
        add(sfx,t,sine(1500,.04)*env(int(.04*SR),.0005,.008),.3)
    elif k=='power':
        for i,m in enumerate([72,76,79,84,88,91]): add(sfx,t+i*.05,sq(nf(m),.12,.25)*env(int(.12*SR),.002,.08),.08)
        d=1.2; x=tt(d); add(sfx,t,lp(noise(d),3)*np.minimum(1,x/.1)*np.exp(-x*2.5),.25)
    elif k=='blip':
        base,_=PITCH.get(e.get('sp','ENZI'),(70,1)); m=base+rng.choice([0,2,4,5,7,9]); d=.045
        add(sfx,t,(sq(nf(m),d,.4)*.6+tri(nf(m),d))*env(int(d*SR),.002,.025),.05)
    elif k=='zone':
        for i,m in enumerate([79,86]): add(sfx,t+i*.09,(sine(nf(m),.5)+.3*sine(nf(m)*2,.5))*env(int(.5*SR),.002,.18),.08)
        d=.35; add(sfx,t-.05,lp(noise(d),4)*np.sin(np.pi*tt(d)/d)**2,.12)
    elif k=='kickball':
        add(sfx,t,lp(noise(.05),3)*env(int(.05*SR),.0005,.015),.4); add(sfx,t,sine(160,.1)*env(int(.1*SR),.001,.04),.3)
    elif k=='kick':
        add(sfx,t,lp(noise(.05),2)*env(int(.05*SR),.0005,.01),.5); add(sfx,t+.25,sine(500,.05)*env(int(.05*SR),.0005,.02),.2)
    elif k=='iris':
        x=tt(.4); add(sfx,t,np.sin(2*np.pi*np.cumsum(900-700*x/.4)/SR)*env(len(x),.01,.2),.08)
    elif k=='door':
        for i,m in enumerate([93,89]): x=tt(.9); add(sfx,t+i*.14,(np.sin(2*np.pi*nf(m)*x)+.4*np.sin(2*np.pi*nf(m)*2.76*x))*env(len(x),.001,.3),.08)
    elif k=='laptop':
        add(sfx,t,sine(2200,.02)*env(int(.02*SR),.0005,.005),.2)
        for i,m in enumerate([72,79,84]): add(sfx,t+.3+i*.0,epiano(m,1.2),.06)
    elif k=='type':
        add(sfx,t,lp(noise(.02),2)*env(int(.02*SR),.0005,.006),.2)
    elif k=='sip':
        d=.5; n=noise(d); n=n-lp(n,5); add(sfx,t,n*np.sin(np.pi*tt(d)/d)*(.6+.4*np.sin(2*np.pi*18*tt(d))),.07)
    elif k=='ahh':
        d=.7; x=tt(d); f=260-60*x/d; v=np.sin(2*np.pi*np.cumsum(f)/SR); v=v+.5*np.sin(2*np.pi*np.cumsum(f*3.1)/SR)+.3*np.sin(2*np.pi*np.cumsum(f*4.3)/SR)
        add(sfx,t,v*np.minimum(1,x/.08)*np.exp(-x*2.2),.06)
        for i,m in enumerate([84,88,91,96]): add(sfx,t+.1+i*.06,sine(nf(m),.4)*env(int(.4*SR),.002,.15),.04)
    elif k=='buzz':
        d=.45; x=tt(d); add(sfx,t,np.sign(np.sin(2*np.pi*150*x))*lp(np.ones(len(x)),1)*(np.sin(2*np.pi*12*x)>0)*np.minimum(1,(d-x)/.05),.06)
    elif k=='notif' or k=='msg':
        for i,m in enumerate([88,95] if k=='notif' else [83,90]): add(sfx,t+i*.08,(sine(nf(m),.25)+.3*sine(nf(m)*2,.25))*env(int(.25*SR),.002,.08),.09)
    elif k=='msgout':
        x=tt(.12); add(sfx,t,np.sin(2*np.pi*np.cumsum(600+900*x/.12)/SR)*env(len(x),.002,.05),.08)
    elif k=='typing':
        for i in range(5): add(sfx,t+i*.05,lp(noise(.015),2)*env(int(.015*SR),.0005,.004),.12)
    elif k=='hop':
        x=tt(.22); add(sfx,t,np.sin(2*np.pi*np.cumsum(300+700*x/.22)/SR)*env(len(x),.002,.1),.08)
    elif k=='think':
        for i,m in enumerate([79,83,86]): add(sfx,t+i*.06,sine(nf(m),.3)*env(int(.3*SR),.002,.1),.05)
    elif k=='cursor':
        add(sfx,t,sq(nf(84),.05,.25)*env(int(.05*SR),.001,.03),.06)
    elif k=='select':
        for i,m in enumerate([76,81,88]): add(sfx,t+i*.07,sq(nf(m),.18,.25)*env(int(.18*SR),.002,.1),.08)
        add(sfx,t,lp(noise(.3),2)*env(int(.3*SR),.001,.08),.15)
    elif k=='poof':
        d=.3; add(sfx,t,lp(noise(d),8)*np.sin(np.pi*tt(d)/d),.18)
    elif k=='cheer':
        d=1.1; x=tt(d); c=lp(noise(d),6); c=c-lp(c,40); add(sfx,t,c/np.max(np.abs(c))*np.minimum(1,x/.1)*np.exp(-x*1.6),.22)
        for i in range(6): add(sfx,t+.05+i*.09,sine(nf(80+i%3*4),.08)*env(int(.08*SR),.002,.03),.03)
    elif k=='complete':
        for i,m in enumerate([72,76,79,84,79,84]): d=.5 if i==5 else .13; add(sfx,t+i*.1,sq(nf(m),d,.25)*env(int(d*SR),.002,.25 if i==5 else .08),.08)
    elif k=='star':
        x=tt(.5); add(sfx,t,(np.sin(2*np.pi*nf(96)*x)+.4*np.sin(2*np.pi*nf(103)*x))*env(len(x),.001,.15),.07)
out=music+sfx
out[-int(1.2*SR):]*=np.linspace(1,0,int(1.2*SR))
out=np.tanh(out*1.4)/np.tanh(1.4); out=out/np.max(np.abs(out))*.89
st=np.stack([out,out],1)
with wave.open('audio.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype(np.int16).tobytes())
print('ok')
