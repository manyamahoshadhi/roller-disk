 let x;
 let y;
 let z;

 document.getElementById("roll").onclick = function(){
    x = Math.floor((Math.random(x)*6)+1);
    document.getElementById("disk1").innerHTML = x;

    y = Math.floor((Math.random(y)*6)+1);
    document.getElementById("disk2").innerHTML = y;

    z = Math.floor((Math.random(z)*6)+1);
    document.getElementById("disk3").innerHTML = z;
 }
