# aliases
alias record-screen='wf-recorder -g "$(slurp)"'
alias record-screen-with-audio='wf-recorder -g "$(slurp)" --audio'
alias webcam-mpv='mpv --demuxer-lavf-format=video4linux2 --demuxer-lavf-o-set=input_format=mjpeg av://v4l2:/dev/video0'
