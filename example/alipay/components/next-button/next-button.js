Component({
  props: {
    enable: false,
    text: '下一步',
    onClick: () => {},
  },

  methods: {
    onClick() {
      this.props.onClick();
    },
  },
});
