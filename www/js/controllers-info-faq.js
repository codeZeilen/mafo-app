angular.module('starter.controllers')

.controller('EventInfoCtrl', function($scope, DataLanguage, $state, $ionicHistory) {

  var changeTemplate = function() {
    if(DataLanguage.currentLanguage() == 'en') {
      if($state.current.name != 'app.infoEn') {
        $ionicHistory.currentView($ionicHistory.backView());
        $state.go('app.infoEn', {}, {'location' : 'replace'});
      }
    } else {
      if($state.current.name != 'app.info') {
        $ionicHistory.currentView($ionicHistory.backView());
        $state.go('app.info', {}, {'location' : 'replace'});
      }
    }
  };

  $scope.$watch(DataLanguage.currentLanguage, function(oldVal, newVal) {
    if(oldVal != newVal) {
      changeTemplate();
    }
  });
  changeTemplate();
})

.controller('FAQCtrl', function($scope, DataLanguage) {
  $scope.questions_de = [
    {
      question: "Wo kann ich einchecken?",
      answer : "Am Donnerstag, den 16.03., kannst Du ab 16:30 Uhr im Rosengarten einchecken. Freitags und Samstags finden die Veranstaltungen im Schloss statt, wo in O 048 auch ein Check-In Schalter aufgebaut ist."
    },
    {
      question: "Was kann mein Namenskärtchen? Und wofür gibt es dieses Bändchen?",
      answer : "Das Namenskärtchen gewährt Dir Einlass zu allen Veranstaltungen sowie dem Bootshausevent. Wir bitten Dich während des gesamten Events das Namenskärtchen und das Bändchen zu tragen. Das Bändchen dient als Eintrittskarte für die Abschlussparty und zeigt darüber hinaus an, wann Du am Mittagessen teilnehmen kannst. Weiß steht für 12 bis 13 Uhr und Rot für 13 bis 14 Uhr."
    },{
      question: "Gibt es einen Dresscode?",
      answer : "Wir verzichten auf eine formale Kleiderordnung. Jedoch empfehlen wir, um den Charakter der Veranstaltung zu unterstützen, seriöse Kleidung während allen Veranstaltungen, orientiert am sogenannten „Business Casual“."
    },{
      question: "Welche Veranstaltungen kann ich besuchen?",
      answer : "Grundsätzlich steht all unseren Teilnehmern der Besuch von Hauptveranstaltungen sowie unserer Abendveranstaltungen offen. Auch die Verpflegung ist inklusive."
      + "Über die Teilnahme an Workshops oder Unternehmensgesprächen wurdest Du gesondert via E-Mail informiert."
    },{
      question: "Ich weiß nicht mehr zu welchen Veranstaltungen ich mich angemeldet habe. Was mache ich jetzt?",
      answer : "In einem solchen Fall kannst Du Dich am Info-Point über die Veranstaltungen informieren, für die Du eine Zusage erhalten hast. Wir empfehlen Dir aber mit der App schon im Voraus Deinen persönlichen Event-Plan zu erstellen."
    },{
      question: "Was mache ich, wenn ich es nicht pünktlich zu einer Veranstaltung schaffe oder eine Veranstaltung voll ist?",
      answer : "Wir bitten alle Teilnehmer um Pünktlichkeit, um die jeweilige Veranstaltung nicht zu stören. Gelegentlich kann es sein, dass es keinen Platz mehr im Veranstaltungssaal gibt. In diesem Fall wirst Du an der Tür darüber informiert und kannst die Veranstaltung ggf. in der Mannheim Forum Lounge live miterleben."
    },{
      question: "Muss ich meine Bestätigungsemail zum Check-in mitbringen?",
      answer : "Nein, beim Check-In im Rosengarten stellst Du Dich einfach in der richtigen Schlange an (nach Nachnamen sortiert). Um sicherzugehen, dass nur der Ticketinhaber sein Namenskärtchen bekommt, bitten wir Dich Deinen Ausweis parat zu halten. Um das richtige Bändchen zu erhalten, solltest Du zum Check-In außerdem Deinen Eventplan mitnehmen, den Du im Voraus dafür erstellt hast. Für uns ist es wichtig zu wissen, an welchen Workshops Du teilnehmen wirst, damit Du stressfrei zum Mittagessen kannst."
    },{
      question: "Muss ich meine Bestätigungsemail zu den Workshops mitbringen?",
      answer : "Nein, weise Dich einfach zu Beginn der Veranstaltung mit Deinem Namenskärtchen aus, die Referenten sind über Dein Kommen informiert."
    },{
      question: "Kann ich persönlich mit den Rednern/Moderatoren sprechen?",
      answer : "Ein persönliches Gespräch unter vier Augen ist vermutlich leider nicht möglich. Bei unseren Hauptveranstaltungen gibt es aber für gewöhnlich am Ende eine Fragerunde, bei der Du Deine Fragen loswerden kannst."
    },{
      question: "Gibt es Anwesenheitspflicht?",
      answer : "Nein. Wir möchten Dich allerdings bitten, zu den Workshops zu erscheinen, für die Du uns eine positive Rückmeldung gegeben hast. Falls Du nicht teilnehmen kannst, gebe uns rechtzeitig Bescheid, sodass die Teilnehmer auf den Wartelisten die Chance bekommen nachzurücken. Das ist den anderen Teilnehmern gegenüber nur fair."
    },{
      question: "Wer ist mein Ansprechpartner für sonstige Fragen und Probleme?",
      answer : "Wir sind vor dem Event unter participants@mannheim-forum.org erreichbar und während des Events gibt es einen ausgeschilderten Infopoint, wo wir Dir gerne bei allen Deinen Fragen und Problemen helfen. Außerdem kannst Du natürlich jederzeit die Mitglieder des Teams ansprechen, wenn Du ihnen über den Weg läufst."
    },{
      question: "Hunger - wann und wo gibt es etwas zu essen?",
      answer : "Freitag- und Samstagmittag bieten wir Dir ein umfangreiches Mittagessen. Es ist sehr wichtig, dass Du zwischen 12 und 13 Uhr essen gehst, wenn Du ein weißes Bändchen erhalten hast. Hast Du ein rotes Bändchen bekommen, bist Du von 13 bis 14 Uhr zum Essen eingeteilt. Während des gesamten Events bieten wir Dir an zwei Getränkestationen die Möglichkeit jederzeit Deinen Durst zu stillen. Außerdem sorgen wir freitags für ein kulinarisches Erlebnis im Bootshaus."
    },{
      question: "Was ist das Kasino? Wie sollte ich mich vorbereiten?",
      answer : "An zwei Veranstaltungstagen hast Du bei unserem Kasino die exklusive Möglichkeit, mit unseren Partnerunternehmen in Kontakt zu treten und Dich über Karrieremöglichkeiten oder das Unternehmen allgemein informieren. Zur Vorbereitung kannst Du Dir <a href='#/app/partners'>hier</a> einmal unsere Partnerunternehmen ansehen."
    },{
      question: "Wie erfahre ich von möglichen Terminänderungen?",
      answer : "Über unseren App-Newsticker erfährst Du alle Änderungen und wichtigen Ereignisse."
    }
  ];

  $scope.questions_en = [
    {
      question: "Where can I check-in?",
      answer : "At the Check-in station in O 048 – the right way will be signposted. The check-in is open on Saturday from 08 to 11 am."
    },{
      question: "What is the nametag and the red wristband for? What happens if I lose it?",
      answer : "The nametag is your ticket to all events during the day. The wristband is your ticket to the closing party at Tiffany Club. Neither of them will be reissued, so please don’t lose either of them ;)"
    },{
      question: "Is there a dresscode?",
      answer : "There is no official, formal dresscode. However we suggest serious clothing during all events, based on the so-called „business casual“ to maintain and support the character of the event."
    },{
      question: "Which events can I go to?",
      answer : "You can go to the English main discussion (Mannheim Forum Spezial) as well as the workshop you received a separate email about. Of course, you can use every opportunity to eat and drink that we offer (lunch, coffee/cake in the afternoon) as well as go to our closing party at Tiffany Club if you have your wristband ready. We informed you about the workshop you can go to separately via email. If you forgot which workshop that was you can ask at the info-point."
    },{
      question: "What happens if I come to an event late or if it is full?",
      answer : "In case you are late you might miss the best part. However you can sneak in also after it already started if there is still seats available. You will be informed about that at the entrance. If there is no space left you can go to the Mannheim Forum Lounge and watch the live cast."
    },{
      question: "Do I need to bring my confirmation email to check-in or to the workshop?",
      answer : "No, simply come to the check-in and line up in the right queue (sorted according to last names). You will be asked to tell us your name and/or to show a valid ID card. The workshop speakers know that you are coming so you don’t need any proof of admittance."
    },{
      question: "Can I talk to speakers/moderators personally?",
      answer : "A personal discussion will probably not be possible. However there’s usually the chance to ask questions in the end of each event. Please use that opportunity."
    },{
      question: "Whom can I ask in case of questions?",
      answer : "Please call +49 (0) 157 54812371 if you need anything or if you have any questions. We can help you with basically everything."
    },{
      question: "Hungry – where and when can I eat?",
      answer : "There’s a lunch buffet on Saturday between 12 am and 2 pm at the Katakomben. In the afternoon there will be coffee and cake."
    },{
      question: "What is the Mannheim Forum Kasino? How can I prepare?",
      answer : "From 10 am to 2 pm you will have the chance to meet our corporate partners personally at the Kasino, which works somewhat like a career fair. Our partners are available at various fair stands at the Aula and look forward to answer your questions about the corporations and career possibilities. Check out our partner page to see who you can meet!"
    },{
      question: "How am I informed in case of changes/news?",
      answer : "Just keep following our newsticker within this App. All important information will be communicated there. Don’t worry if there will be some messages only in German – all information relevant to you will be translated and displayed in English."
    }
  ];

  var updateQuestions = function() {
    if(DataLanguage.currentLanguage() == 'en') {
      $scope.questions = $scope.questions_en;
    } else {
      $scope.questions = $scope.questions_de;
    }
  };
  $scope.$watch(DataLanguage.currentLanguage, function(oldVal, newVal) {
    if(oldVal != newVal) {
      updateQuestions();
    }
  });
  updateQuestions();


});
