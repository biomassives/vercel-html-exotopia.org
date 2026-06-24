const app = Vue.createApp({
    data() {
        return {
            activities: []
        };
    },
    mounted() {
        // For now, we're using static data, but you can replace this with an Axios call to fetch data from an API
        this.activities = [
            // Your provided data here
        ];
    },
    methods: {
        formatDate(date) {
            return new Date(date).toLocaleDateString();
        }
    }
});

app.mount('#app');
