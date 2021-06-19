<script>
    import { fade } from "svelte/transition";

</script>


<div class="row" style="margin-top: 15%; margin-bottom: 5%;" in:fade>
    <div class="six columns">
        <img src="/img/startsession.gif" alt="how to start a session" style="width:100%">
    </div>
    <div class="six columns">
        <h5  style="margin-bottom: 0;">Start a session</h5>
        <hr style="margin-top: 0; margin-bottom: 3%;">
        <p>Um eine Session zu starten, im Hauptmenu auf "Start" klicken, einen Nutzernamen eingeben und erneut auf "Start" klicken.</p>
        <p>Verwendet man das Tool regelmäßig, ist es hilfreich, die erstellte Session als Lesezeichen zu speichern. So kann man immer wieder dieselbe Session nutzen, ohne jedes Mal eine Neue erstellen zu müssen.</p>
    </div>
</div>

<div class="row" style="margin-bottom: 5%;" in:fade>
    <div class="six columns">
        <img src="/img/joinsession.gif" alt="how to join a session" style="width:100%">
    </div>
    <div class="six columns">
        <h5  style="margin-bottom: 0;">Join a session</h5>
        <hr style="margin-top: 0; margin-bottom: 3%;">
        <p>Um einer Session manuell beizutreten, im Hauptmenu auf "Join" klicken, einen Nutzernamen sowie eine Raum-ID eingeben und erneut auf "Join" klicken. Wenn die eingegebene ID nicht existiert, wird eine neue Session mit dieser ID erstellt.</p>
        <p>Einer bestehenden Session kann nicht nur manuell, sondern auch per Einladungslink beigetreten werden. Mit dem Link muss man nur den Nutzernamen eingeben und kann direkt beitreten.</p>
        <p>Wenn das Tool bereits genutzt wurde, wird der zuletzt verwendete Nutzername vorausgefüllt. Man kann ihn jedoch bei jedem Start oder Beitritt einer Session ändern.</p>
    </div>
</div>

<div class="row" style="margin-bottom: 5%;" in:fade>
    <div class="six columns">
        <img src="/img/copyinvitationlink.gif" alt="how to copy an invitation link" style="width:100%">
    </div>
    <div class="six columns">
        <h5  style="margin-bottom: 0;">Copy invitation link</h5>
        <hr style="margin-top: 0; margin-bottom: 3%;">
        <p>Um den Einladungslink zu einer Session in die Zwischenablage zu kopieren, das Copy-Icon neben der "room-id" anklicken. Der Link kann anschließend direkt an Kollegen weitergeschickt werden.</p>
    </div>
</div>

<div class="row" style="margin-bottom: 5%;" in:fade>
    <div class="six columns">
        <img src="/img/estimationsandreset.gif" alt="how to estimate and reset" style="width:100%">
    </div>
    <div class="six columns">
        <h5  style="margin-bottom: 0;">Set and reset estimations</h5>
        <hr style="margin-top: 0; margin-bottom: 3%;">
        <p>Um eine Schätzung abzugeben, einen der Buttons im unteren Bereich anklicken. Bis alle Teilnehmer ihre Schätzung abgegeben haben, erscheint statt der Schätzung ein Haken, um zu zeigen, wer bereits geschätzt hat. Die eigene Schätzung kann nur geändert werden, wenn noch nicht alle geschätzt haben.</p>
        <p>Sobald jeder Teilnehmer eine Schätzung abgegeben hat, werden alle Werte zeitgleich aufgedeckt. Der Durchschnitt aller Zahlenwerte wird am Ende der Liste in orange ausgegeben. Der Nutzer mit der höchsten/niedrigsten Schätzung wird mit einem Pfeil nach oben bzw. unten hervorgehoben. Ohne höchste oder niedrigste Schätzung erscheinen keine Pfeile.</p>
        <p>Tritt ein Teilnehmer nach dem Aufdecken bei, werden alle Werte verdeckt, damit der neue Teilnehmer seine Schätzung unbeeinflusst abgeben kann.</p>
        <p>Um alle Schätzungen zurückzusetzen, den blauen "Reset" Button betätigen.</p>
    </div>
</div>

<div class="row" style="margin-bottom: 5%;" in:fade>
    <div class="six columns">
        <img src="/img/joinasspectator.gif" alt="how to join as spectator" style="width:100%">
    </div>
    <div class="six columns">
        <h5  style="margin-bottom: 0;">Join as spectator</h5>
        <hr style="margin-top: 0; margin-bottom: 3%;">
        <p>Möchte man der Session teilnehmen ohne mitzuschätzen, hat man die Möglichkeit, als Zuschauer beizutreten. Hierzu beim Beitreten einfach die Option "Join as spectator" aktivieren. Als Zuschauer ist man seperat aufgelistet und kann lediglich die Schätzungen zurücksetzen.</p>
    </div>
</div>

<div class="row" style="margin-bottom: 5%;" in:fade>
    <div class="six columns">
        <img src="/img/changetheme.gif" alt="how to change the theme" style="width:100%">
    </div>
    <div class="six columns">
        <h5  style="margin-bottom: 0;">Change theme</h5>
        <hr style="margin-top: 0; margin-bottom: 3%;">
        <p>Das Erscheinungsbild kann über das Theme-Icon (Mond/Sonne) in der rechten oberen Ecke geändert werden. Die eingestellten Präferenzen werden gespeichert.</p>
    </div>
</div>