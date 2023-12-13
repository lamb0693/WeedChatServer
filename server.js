const express = require('express');
const app = express();
const http = require('http');

const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

const server = http.createServer(app);
const { Server } = require("socket.io");

// CORS를 무력화 시킴,  모든 origin의 접속을 받음.
// spring server에서 올 거니 그기만 열어 주는 것이 제일 좋음
const ioServer = new Server(server, {
    cors: {
        origin: '*'
    }
});

// 회사용이라 미리 부서를 만들어 놓았슴.. 방 만들기 기능은 구현 안해 놓음
// 대신 다른 부서를 위해서 확장 여지 남겨 놓음
const onLineDevelop = []
// const onLineXXXX = [] 다른 방 이름 이렇게 추가 가능

const weedServer = ioServer.of('/weed')

weedServer.on('connection', (socket) => {
    console.log('a user connected');

    // join하면 여기서  switch(room) 해서 다른 방도 들어갈 수 있게 구현 가능
    // 현재는 develop 방만 가능하게 되어 있음
    // 다른 방이면 그 방이름으로 변수 조절하면 됨
    socket.on('join', (joinInfo) => {

        console.log('join to room, name', joinInfo["room"], joinInfo["name"])
        socket.join(joinInfo["room"]) // 채팅 방에 참가

        // 방 멤버 전달을 위해 참가자 배열  만들기
        onLineDevelop.push( {socket_id:socket.id, name:joinInfo["name"]} )
        console.log('onLine members on connect:', onLineDevelop)

        // 전체 방 멤버에게 참가자 명단 전송
        weedServer.to('develop').emit('on_line_develop', onLineDevelop)
    })
    
    // 사용자가 접속이 끊어 지면
    // 현재는 develop 방이라 가정하고 코드 구현
    // 방이 여러개면 여기서 socket.id를 이용 어느 방 참가자인지 확인 후 그방에서 제거 및 그방으로 전달
    socket.on('disconnect', () => {
        console.log('user disconnected')

        // 참가자 명단 배열에서 종료된 사용자 이름을 제거
        const index = onLineDevelop.findIndex((user) => user.socket_id === socket.id);
        if (index !== -1) {
            onLineDevelop.splice(index, 1);
            console.log('onLine members after disconnect:', onLineDevelop);
        }

        // 방에서 탈퇴 시킴
        socket.leave('develop')

        // 새로운 참가자 명단을 전체 방 멤버에 전송
        weedServer.to('develop').emit('on_line_develop', onLineDevelop)
    });

    // 사용자가 메시지를 서버에 전송하면 보내오는 메시지
    // 방 멤버 전체제 메시지 내용을 update 해야 된다고 전달
    socket.on('update_board', (name) => {
        console.log('update_board : ', name)
        weedServer.to('develop').emit('update_board', name)
    })

});

// 서버를 시작합니다 적당한 포트 번호를 사용하면 됨
server.listen(3002, () => {
    console.log('listening on *:3002');
});